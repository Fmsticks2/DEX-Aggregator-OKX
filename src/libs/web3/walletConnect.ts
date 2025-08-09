import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { wagmiConfig } from './wagmi'
import { PUBLIC_WALLET_CONNECT_PROJECT_ID } from '$env/static/public'
import { chains } from './chains'

const projectId = PUBLIC_WALLET_CONNECT_PROJECT_ID
const themeMode = (localStorage.getItem('theme') || 'dark') as 'light' | 'dark'

const wagmiAdapter = new WagmiAdapter({
  networks: chains as any,
  projectId
})

export const web3modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: chains as any,
  projectId,
  metadata: {
    name: 'MEV-Resistant DEX Aggregator',
    description: 'A decentralized exchange aggregator with MEV protection',
    url: 'https://localhost:5175',
    icons: ['/dex-logo.png']
  },
  themeMode,
  themeVariables: {
    '--w3m-accent': 'hsl(262 80% 50%)',
    '--w3m-color-mix': 'hsl(262 80% 50%)',
  }
})
