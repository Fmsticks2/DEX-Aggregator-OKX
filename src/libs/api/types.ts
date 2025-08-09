import type { Address, Chain, Hex } from 'viem'
import type { Token } from '../token/types'

export interface BaseArgs {
  chain: Chain
  sellAmount: string
  sellToken?: Address
  buyToken?: string
  takerAddress?: Address
  slippagePercentage?: string
}

export interface OxApiArgs extends BaseArgs {
  apiCall: string
}

export interface GetPriceArgs extends BaseArgs {}

export interface GetQuoteArgs extends BaseArgs {}

export type FetchResponseData = {
  tokens: Token[]
}

export type PriceResponseData = {
  price: string
  estimatedGas: string
  buyAmount: string
}

export type QuoteResponseData = {
  to: Address
  data: Hex
  gas: string
  value: string
  chainId: number
  gasPrice: string
  estimatedGas: string
  allowanceTarget: Address
}

// OKX DEX API Types
export interface OKXQuoteArgs {
  chainId: number
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  slippage?: string
}

export interface OKXSwapArgs extends OKXQuoteArgs {
  userWalletAddress: string
}

export interface OKXQuoteResponse {
  code: string
  data: [{
    routerResult: {
      chainId: string
      fromToken: {
        decimal: string
        tokenContractAddress: string
        tokenSymbol: string
        tokenUnitPrice: string
      }
      toToken: {
        decimal: string
        tokenContractAddress: string
        tokenSymbol: string
        tokenUnitPrice: string
      }
      fromTokenAmount: string
      toTokenAmount: string
      estimateGasFee: string
      dexRouterList: Array<{
        router: string
        routerPercent: string
        subRouterList: Array<{
          dexProtocol: Array<{
            dexName: string
            percent: string
          }>
        }>
      }>
    }
  }]
}

export interface OKXSwapResponse {
  code: string
  data: [{
    tx: {
      to: string
      data: string
      gas: string
      gasPrice: string
      value: string
    }
    routerResult: {
      chainId: string
      fromTokenAmount: string
      toTokenAmount: string
      estimateGasFee: string
    }
  }]
}

// ERC-4337 Types
export interface UserOperation {
  sender: Address
  nonce: bigint
  initCode: Hex
  callData: Hex
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: Hex
  signature: Hex
}

export interface BundleIntent {
  id: string
  userOp: UserOperation
  swapData: {
    fromToken: string
    toToken: string
    amount: string
    expectedOutput: string
  }
  timestamp: number
  status: 'pending' | 'bundled' | 'executed' | 'failed'
  estimatedSavings?: string
}

export interface MEVComparison {
  ourRate: string
  uniswapRate: string
  oneInchRate: string
  savings: string
  savingsPercentage: string
}

// ZK Proof Types
export interface ZKProof {
  proof: {
    pi_a: [string, string, string]
    pi_b: [[string, string], [string, string], [string, string]]
    pi_c: [string, string, string]
  }
  publicSignals: string[]
}

export interface FairOrderingProof {
  zkProof: ZKProof
  commitment: string
  nullifier: string
  timestamp: number
  isValid: boolean
}
