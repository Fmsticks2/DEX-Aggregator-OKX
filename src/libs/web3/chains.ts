import type { Chain } from 'viem'
import { arbitrum, mainnet, polygon, goerli, optimism, avalanche, base, bsc, sepolia } from '@wagmi/core/chains'

// XLayer chain configuration
export const xlayer: Chain = {
  id: 196,
  name: 'XLayer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { http: ['https://rpc.xlayer.tech'] },
    default: { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    etherscan: { name: 'OKLink', url: 'https://www.oklink.com/xlayer' },
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 47416,
    },
  },
}

export const chains: Chain[] = [mainnet, sepolia, goerli, arbitrum, optimism, polygon, avalanche, base, bsc, xlayer]

const iconChainBaseURL = 'https://icons.llamao.fi/icons/chains'
const apiBaseDomain = 'api.0x.org'

type ChainMeta = {
  iconUrl: string
  apiBase: string
}

export const chainMetaMap: Record<number, ChainMeta> = {
  [mainnet.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_ethereum.jpg`,
    apiBase: `https://${apiBaseDomain}`,
  },
  [sepolia.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_ethereum.jpg`,
    apiBase: `https://sepolia.${apiBaseDomain}`,
  },
  [goerli.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_ethereum.jpg`,
    apiBase: `https://goerli.${apiBaseDomain}`,
  },
  [optimism.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_optimism.jpg`,
    apiBase: `https://optimism.${apiBaseDomain}`,
  },
  [arbitrum.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_arbitrum.jpg`,
    apiBase: `https://arbitrum.${apiBaseDomain}`,
  },
  [avalanche.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_avalanche.jpg`,
    apiBase: `https://avalanche.${apiBaseDomain}`,
  },
  [polygon.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_polygon.jpg`,
    apiBase: `https://polygon.${apiBaseDomain}`,
  },
  [base.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_base.jpg`,
    apiBase: `https://base.${apiBaseDomain}`,
  },
  [bsc.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_bsc.jpg`,
    apiBase: `https://bsc.${apiBaseDomain}`,
  },
  [xlayer.id]: {
    iconUrl: `${iconChainBaseURL}/rsz_ethereum.jpg`, // Using Ethereum icon as placeholder
    apiBase: `https://xlayer.${apiBaseDomain}`, // Placeholder API base
  },
}
