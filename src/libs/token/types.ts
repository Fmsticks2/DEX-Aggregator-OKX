/**
 * Token Types
 * Defines interfaces and types for token management
 */

export interface Token {
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  chainId: number
  tags?: string[]
  balance?: string
}

export interface TokenList {
  name: string
  version: {
    major: number
    minor: number
    patch: number
  }
  tokens: Token[]
  keywords?: string[]
  logoURI?: string
  timestamp?: string
}

export interface TokenBalance {
  token: Token
  balance: string // Raw balance in wei/smallest unit
  formattedBalance: string // Human-readable balance
  valueUSD?: number
}

export interface TokenPrice {
  address: string
  symbol: string
  price: number
  priceChange24h?: number
  marketCap?: number
  volume24h?: number
  lastUpdated: number
}

export interface TokenQuote {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  rate: string
  priceImpact: number
  estimatedGas: string
  route?: TokenRoute[]
  validUntil?: number
}

export interface TokenRoute {
  protocol: string
  percentage: number
  fromToken: Token
  toToken: Token
  pool?: {
    address: string
    fee: number
    liquidity?: string
  }
}

export interface TokenApproval {
  token: Token
  spender: string
  amount: string
  txHash?: string
  status: 'pending' | 'confirmed' | 'failed'
}

// Common token addresses for different chains
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Popular tokens by chain
export const POPULAR_TOKENS: Record<number, Token[]> = {
  1: [ // Ethereum
    {
      address: NATIVE_TOKEN_ADDRESS,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      chainId: 1,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
    },
    {
      address: '0xA0b86a33E6441b8C0b7b2e0b6e0b6e0b6e0b6e0b',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      chainId: 1,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441b8c0b7b2e0b6e0b6e0b6e0b6e0b.png'
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      chainId: 1,
      logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
    }
  ],
  137: [ // Polygon
    {
      address: NATIVE_TOKEN_ADDRESS,
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
      chainId: 137,
      logoURI: 'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png'
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      chainId: 137,
      logoURI: 'https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png'
    }
  ],
  56: [ // BSC
    {
      address: NATIVE_TOKEN_ADDRESS,
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
      chainId: 56,
      logoURI: 'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png'
    }
  ]
}

// Token list URLs
export const TOKEN_LIST_URLS = {
  ethereum: 'https://tokens.1inch.io/v1.2/1',
  polygon: 'https://tokens.1inch.io/v1.2/137',
  bsc: 'https://tokens.1inch.io/v1.2/56',
  arbitrum: 'https://tokens.1inch.io/v1.2/42161',
  optimism: 'https://tokens.1inch.io/v1.2/10'
}

// Utility functions
export function isNativeToken(token: Token): boolean {
  return token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
}

export function formatTokenAmount(amount: string, decimals: number, precision = 6): string {
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return value.toFixed(precision)
}

export function parseTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount) * Math.pow(10, decimals)
  return Math.floor(value).toString()
}

export function getTokenKey(token: Token): string {
  return `${token.chainId}-${token.address.toLowerCase()}`
}

export function isSameToken(tokenA: Token, tokenB: Token): boolean {
  return (
    tokenA.chainId === tokenB.chainId &&
    tokenA.address.toLowerCase() === tokenB.address.toLowerCase()
  )
}

// Legacy type for compatibility
export type ERC20Token = Required<Token>
