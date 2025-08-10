import axios from 'axios'
import { TokenQuote } from '../libs/token/types'

export interface ZeroXQuoteArgs {
  sellToken: string
  buyToken: string
  sellAmount?: string
  buyAmount?: string
  slippagePercentage?: number
  gasPrice?: string
  takerAddress?: string
  excludedSources?: string
  includedSources?: string
  skipValidation?: boolean
  intentOnFilling?: boolean
}

export interface ZeroXQuoteResponse {
  chainId: number
  price: string
  guaranteedPrice: string
  estimatedPriceImpact: string
  to: string
  data: string
  value: string
  gas: string
  estimatedGas: string
  gasPrice: string
  protocolFee: string
  minimumProtocolFee: string
  buyTokenAddress: string
  sellTokenAddress: string
  buyAmount: string
  sellAmount: string
  sources: Array<{
    name: string
    proportion: string
  }>
  orders: any[]
  allowanceTarget: string
  decodedUniqueId: string
  sellTokenToEthRate: string
  buyTokenToEthRate: string
  expectedSlippage: string
}

const ZERO_X_API_BASE = 'https://api.0x.org'

/**
 * Get a quote from 0x API
 */
export async function get0xQuote(args: ZeroXQuoteArgs, chainId: number = 1): Promise<TokenQuote> {
  try {
    const params = new URLSearchParams()
    
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString())
      }
    })

    const response = await axios.get<ZeroXQuoteResponse>(
      `${ZERO_X_API_BASE}/swap/v1/quote?${params.toString()}`,
      {
        headers: {
          '0x-api-key': import.meta.env.VITE_ZERO_X_API_KEY || ''
        }
      }
    )

    const data = response.data
    
    return {
      fromToken: {
        address: data.sellTokenAddress,
        symbol: '', // Would need to fetch from token contract
        decimals: 18,
        name: '',
        chainId
      },
      toToken: {
        address: data.buyTokenAddress,
        symbol: '', // Would need to fetch from token contract
        decimals: 18,
        name: '',
        chainId
      },
      fromAmount: data.sellAmount,
      toAmount: data.buyAmount,
      estimatedGas: data.estimatedGas,
      route: data.sources.map(source => ({
        protocol: source.name,
        percentage: parseFloat(source.proportion) * 100,
        fromToken: {
          address: data.sellTokenAddress,
          symbol: '',
          decimals: 18,
          name: '',
          chainId
        },
        toToken: {
          address: data.buyTokenAddress,
          symbol: '',
          decimals: 18,
          name: '',
          chainId
        }
      })),
      priceImpact: parseFloat(data.estimatedPriceImpact),
      rate: data.price,
      validUntil: Date.now() + 60 * 1000
    }
  } catch (error) {
    console.error('0x quote error:', error)
    throw error
  }
}

/**
 * Get swap transaction data from 0x API
 */
export async function get0xSwap(args: ZeroXQuoteArgs): Promise<any> {
  try {
    const params = new URLSearchParams()
    
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString())
      }
    })

    const response = await axios.get<ZeroXQuoteResponse>(
      `${ZERO_X_API_BASE}/swap/v1/quote?${params.toString()}`,
      {
        headers: {
          '0x-api-key': import.meta.env.VITE_ZERO_X_API_KEY || ''
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('0x swap error:', error)
    throw error
  }
}