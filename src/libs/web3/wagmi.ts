import { http, createConfig } from '@wagmi/core'
import { walletConnect, injected, coinbaseWallet } from '@wagmi/connectors'
import { PUBLIC_WALLET_CONNECT_PROJECT_ID } from '$env/static/public'
import { chains } from './chains'

const projectId = PUBLIC_WALLET_CONNECT_PROJECT_ID

// Create transports for all chains
const transports = chains.reduce((acc, chain) => {
  acc[chain.id] = http()
  return acc
}, {} as Record<number, ReturnType<typeof http>>)

export const wagmiConfig = createConfig({
  chains: chains as any,
  connectors: [
    walletConnect({ projectId }),
    injected(),
    coinbaseWallet({ appName: 'MEV-Resistant DEX Aggregator' })
  ],
  transports
})

export function isChainSupported(chainId: number | string) {
  return Boolean(chains.find((supportedChain) => supportedChain.id === Number(chainId)))
}

export function checkSupportedChain(chainId: number) {
  if (!isChainSupported(chainId)) {
    throw new Error(`Chain ${chainId} is not supported`)
  }
}
