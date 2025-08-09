import axios from 'axios'
import { TokenQuote } from '../libs/token/types'

export interface OKXQuoteArgs {
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  chainId: number
  slippage?: number
}

export interface OKXSwapArgs extends OKXQuoteArgs {
  userWalletAddress: string
  referrerAddress?: string
}

export interface OKXQuoteResponse {
  code: string
  msg: string
  data: [{
    chainId: string
    dexRouterList: Array<{
      router: string
      routerPercent: string
      subRouterList: Array<{
        dexProtocol: string
        percent: string
      }>
    }>
    estimateGasFee: string
    fromToken: {
      tokenContractAddress: string
      tokenSymbol: string
      tokenUnitPrice: string
    }
    fromTokenAmount: string
    toToken: {
      tokenContractAddress: string
      tokenSymbol: string
      tokenUnitPrice: string
    }
    toTokenAmount: string
    tradeFee: string
  }]
}

export interface OKXSwapResponse {
  code: string
  msg: string
  data: [{
    tx: {
      data: string
      from: string
      gas: string
      gasPrice: string
      to: string
      value: string
    }
    routerResult: {
      chainId: string
      dexRouterList: any[]
      estimateGasFee: string
      fromToken: any
      fromTokenAmount: string
      toToken: any
      toTokenAmount: string
      tradeFee: string
    }
  }]
}

const OKX_DEX_API_BASE = 'https://www.okx.com/api/v5/dex/aggregator'

/**
 * Get a quote from OKX DEX aggregator
 */
export async function getOKXQuote(args: OKXQuoteArgs): Promise<TokenQuote> {
  try {
    const params = new URLSearchParams({
      chainId: args.chainId.toString(),
      fromTokenAddress: args.fromTokenAddress,
      toTokenAddress: args.toTokenAddress,
      amount: args.amount,
      slippage: (args.slippage || 0.5).toString()
    })

    const response = await axios.get<OKXQuoteResponse>(
      `${OKX_DEX_API_BASE}/quote?${params.toString()}`
    )

    if (response.data.code !== '0' || !response.data.data?.[0]) {
      throw new Error(response.data.msg || 'Failed to get quote')
    }

    const data = response.data.data[0]
    
    return {
      fromToken: {
        address: data.fromToken.tokenContractAddress,
        symbol: data.fromToken.tokenSymbol,
        decimals: 18, // Default, should be fetched from token contract
        name: data.fromToken.tokenSymbol,
        chainId: args.chainId
      },
      toToken: {
        address: data.toToken.tokenContractAddress,
        symbol: data.toToken.tokenSymbol,
        decimals: 18, // Default, should be fetched from token contract
        name: data.toToken.tokenSymbol,
        chainId: args.chainId
      },
      fromAmount: data.fromTokenAmount,
      toAmount: data.toTokenAmount,
      estimatedGas: data.estimateGasFee,
      route: data.dexRouterList.map(router => ({
        protocol: router.router,
        percentage: parseFloat(router.routerPercent),
        fromToken: {
          address: data.fromToken.tokenContractAddress,
          symbol: data.fromToken.tokenSymbol,
          decimals: 18,
          name: data.fromToken.tokenSymbol,
          chainId: args.chainId
        },
        toToken: {
          address: data.toToken.tokenContractAddress,
          symbol: data.toToken.tokenSymbol,
          decimals: 18,
          name: data.toToken.tokenSymbol,
          chainId: args.chainId
        }
      })),
      priceImpact: 0, // Not provided by OKX API
      rate: (parseFloat(data.toTokenAmount) / Math.max(parseFloat(data.fromTokenAmount), 1e-18)).toString(),
      validUntil: Date.now() + 60 * 1000
    }
  } catch (error) {
    console.error('OKX quote error:', error)
    throw error
  }
}

/**
 * Get swap transaction data from OKX DEX aggregator
 */
export async function getOKXSwap(args: OKXSwapArgs): Promise<any> {
  try {
    const params = new URLSearchParams({
      chainId: args.chainId.toString(),
      fromTokenAddress: args.fromTokenAddress,
      toTokenAddress: args.toTokenAddress,
      amount: args.amount,
      slippage: (args.slippage || 0.5).toString(),
      userWalletAddress: args.userWalletAddress
    })

    if (args.referrerAddress) {
      params.append('referrerAddress', args.referrerAddress)
    }

    const response = await axios.get<OKXSwapResponse>(
      `${OKX_DEX_API_BASE}/swap?${params.toString()}`
    )

    if (response.data.code !== '0' || !response.data.data?.[0]) {
      throw new Error(response.data.msg || 'Failed to get swap data')
    }

    return response.data.data[0]
  } catch (error) {
    console.error('OKX swap error:', error)
    throw error
  }
}