export interface ChainConfig {
  id: number
  name: string
  symbol: string
  decimals: number
  rpcUrl: string
  blockExplorer: string
  logoUrl?: string
  isTestnet?: boolean
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg'
  },
  137: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon.llamarpc.com',
    blockExplorer: 'https://polygonscan.com',
    logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.svg'
  },
  56: {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc.llamarpc.com',
    blockExplorer: 'https://bscscan.com',
    logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg'
  },
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arbitrum.llamarpc.com',
    blockExplorer: 'https://arbiscan.io',
    logoUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg'
  },
  10: {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://optimism.llamarpc.com',
    blockExplorer: 'https://optimistic.etherscan.io',
    logoUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg'
  },
  8453: {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://base.llamarpc.com',
    blockExplorer: 'https://basescan.org',
    logoUrl: 'https://cryptologos.cc/logos/base-base-logo.svg'
  },
  196: {
    id: 196,
    name: 'X Layer',
    symbol: 'OKB',
    decimals: 18,
    rpcUrl: 'https://rpc.xlayer.tech',
    blockExplorer: 'https://www.oklink.com/xlayer',
    logoUrl: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png'
  }
}

export const DEFAULT_CHAIN_ID = 1

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId]
}

export function isChainSupported(chainId: number): boolean {
  return chainId in SUPPORTED_CHAINS
}

export function getAllSupportedChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS)
}