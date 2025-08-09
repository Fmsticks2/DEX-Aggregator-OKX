/**
 * ERC-4337 Types
 * Defines interfaces and types for Account Abstraction
 */

export interface UserOperation {
  sender: string
  nonce: string
  initCode: string
  callData: string
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  paymasterAndData: string
  signature: string
  hash: string
  status: 'pending' | 'included' | 'failed'
  timestamp: number
  txHash?: string
}

export interface Bundle {
  id: string
  userOperations: UserOperation[]
  status: 'pending' | 'submitted' | 'confirmed' | 'failed'
  timestamp: number
  txHash?: string
  zkProof?: ZKProof
  mevProtection: boolean
  fairOrdering: boolean
}

export interface ZKProof {
  proof: string
  publicSignals: string[]
  verificationKey: string
  circuit: string
}

export interface SmartAccount {
  address: string
  owner: string
  factory: string
  implementation: string
  isDeployed: boolean
  nonce: number
}

export interface Paymaster {
  address: string
  type: 'verifying' | 'deposit' | 'token'
  supportedTokens?: string[]
  gasPolicy?: GasPolicy
}

export interface GasPolicy {
  maxGasLimit: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  validUntil: number
  validAfter: number
}

export interface BundlerConfig {
  entryPoint: string
  bundlerUrl: string
  chainId: number
  supportedPaymasters: Paymaster[]
  maxBundleSize: number
  minBundleSize: number
  bundleInterval: number // in milliseconds
}

export interface SwapIntent {
  id: string
  user: string
  fromToken: string
  toToken: string
  fromAmount: string
  minToAmount: string
  deadline: number
  slippage: number
  mevProtection: boolean
  zkProof?: ZKProof
  status: 'pending' | 'bundled' | 'executed' | 'failed'
  timestamp: number
}

export interface MEVProtectionData {
  enabled: boolean
  protectionLevel: 'basic' | 'advanced' | 'maximum'
  fairOrderingProof?: ZKProof
  bundlePosition?: number
  estimatedSavings?: string
}

export interface BundlerResponse {
  userOpHash: string
  bundleId?: string
  status: 'accepted' | 'rejected'
  reason?: string
  estimatedGas?: string
  estimatedTime?: number
}

export interface UserOperationReceipt {
  userOpHash: string
  entryPoint: string
  sender: string
  nonce: string
  paymaster?: string
  actualGasCost: string
  actualGasUsed: string
  success: boolean
  reason?: string
  logs: Log[]
  receipt: TransactionReceipt
}

export interface Log {
  address: string
  topics: string[]
  data: string
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  blockHash: string
  logIndex: number
  removed: boolean
}

export interface TransactionReceipt {
  to: string
  from: string
  contractAddress?: string
  transactionIndex: number
  gasUsed: string
  logsBloom: string
  blockHash: string
  transactionHash: string
  logs: Log[]
  blockNumber: number
  confirmations: number
  cumulativeGasUsed: string
  effectiveGasPrice: string
  status: number
  type: number
}

// Constants
export const ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
export const SIMPLE_ACCOUNT_FACTORY = '0x9406Cc6185a346906296840746125a0E44976454'

// Gas limits
export const DEFAULT_GAS_LIMITS = {
  callGasLimit: '100000',
  verificationGasLimit: '150000',
  preVerificationGas: '21000',
  maxFeePerGas: '20000000000', // 20 gwei
  maxPriorityFeePerGas: '2000000000' // 2 gwei
}

// Utility functions
export function getUserOperationHash(
  userOp: Partial<UserOperation>,
  entryPoint: string,
  chainId: number
): string {
  // This would implement the actual hash calculation
  // For now, return a placeholder
  return `0x${Math.random().toString(16).slice(2)}`
}

export function isUserOperationValid(userOp: UserOperation): boolean {
  return (
    userOp.sender !== '' &&
    userOp.nonce !== '' &&
    userOp.callData !== '' &&
    userOp.signature !== ''
  )
}

export function estimateUserOperationGas(userOp: Partial<UserOperation>): {
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
} {
  // Basic estimation - in production this would be more sophisticated
  return {
    callGasLimit: userOp.callGasLimit || DEFAULT_GAS_LIMITS.callGasLimit,
    verificationGasLimit: userOp.verificationGasLimit || DEFAULT_GAS_LIMITS.verificationGasLimit,
    preVerificationGas: userOp.preVerificationGas || DEFAULT_GAS_LIMITS.preVerificationGas
  }
}

export function createSwapIntent(
  user: string,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  minToAmount: string,
  slippage: number,
  mevProtection = true
): SwapIntent {
  return {
    id: `intent_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    user,
    fromToken,
    toToken,
    fromAmount,
    minToAmount,
    deadline: Date.now() + 20 * 60 * 1000, // 20 minutes
    slippage,
    mevProtection,
    status: 'pending',
    timestamp: Date.now()
  }
}

export function createBundle(
  userOperations: UserOperation[],
  mevProtection = true,
  fairOrdering = true
): Bundle {
  return {
    id: `bundle_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userOperations,
    status: 'pending',
    timestamp: Date.now(),
    mevProtection,
    fairOrdering
  }
}