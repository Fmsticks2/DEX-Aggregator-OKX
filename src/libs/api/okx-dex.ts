import getError from '../utils/getError'
import type { OKXQuoteArgs, OKXSwapArgs, OKXQuoteResponse, OKXSwapResponse } from './types'

const OKX_DEX_BASE_URL = 'https://www.okx.com/api/v5/dex/aggregator'

/**
 * Get quote from OKX DEX API
 * Provides price information and routing details
 */
export async function getOKXQuote({
  chainId,
  fromTokenAddress,
  toTokenAddress,
  amount,
  slippage = '0.5'
}: OKXQuoteArgs): Promise<OKXQuoteResponse> {
  const queryParams = new URLSearchParams({
    chainId: chainId.toString(),
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage
  })

  const response = await fetch(`api/okx-dex/quote?${queryParams}`)

  if (!response.ok) {
    const error = await getError(response)
    throw error
  }

  return response.json()
}

/**
 * Get swap transaction data from OKX DEX API
 * Returns executable transaction data for the swap
 */
export async function getOKXSwap({
  chainId,
  fromTokenAddress,
  toTokenAddress,
  amount,
  userWalletAddress,
  slippage = '0.5'
}: OKXSwapArgs): Promise<OKXSwapResponse> {
  const queryParams = new URLSearchParams({
    chainId: chainId.toString(),
    fromTokenAddress,
    toTokenAddress,
    amount,
    userWalletAddress,
    slippage
  })

  const response = await fetch(`api/okx-dex/swap?${queryParams}`)

  if (!response.ok) {
    const error = await getError(response)
    throw error
  }

  return response.json()
}

/**
 * Get supported tokens for a specific chain
 */
export async function getOKXSupportedTokens(chainId: number) {
  const response = await fetch(`api/okx-dex/tokens?chainId=${chainId}`)
  
  if (!response.ok) {
    const error = await getError(response)
    throw error
  }

  return response.json()
}

/**
 * Get cross-chain quote for XLayer compatibility
 */
export async function getOKXCrossChainQuote({
  fromChainId,
  toChainId,
  fromTokenAddress,
  toTokenAddress,
  amount,
  slippage = '0.5'
}: {
  fromChainId: number
  toChainId: number
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  slippage?: string
}) {
  const queryParams = new URLSearchParams({
    fromChainId: fromChainId.toString(),
    toChainId: toChainId.toString(),
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage
  })

  const response = await fetch(`api/okx-dex/cross-chain-quote?${queryParams}`)
  
  if (!response.ok) {
    const error = await getError(response)
    throw error
  }

  return response.json()
}