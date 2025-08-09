import { watchAccount } from '@wagmi/core'
import { network } from '../../stores/network'
import { account } from '../../stores/account'
import { wagmiConfig } from './wagmi'

let isWatching = false
let unwatchAccount: () => void

export function startWatching() {
  if (isWatching) return

  unwatchAccount = watchAccount(wagmiConfig, {
    onChange: async (data) => {
      console.log('Account change:', data)
      account.set(data)
      
      // Handle chain changes through account data
      if (data.chainId) {
        const chains = wagmiConfig.chains
        const chain = chains.find((chain: any) => chain.id === data.chainId)
        console.log('Network change:', chain)
        network.set(chain)
      }
    }
  })
  
  isWatching = true
}

export function stopWatching() {
  unwatchAccount?.()
  isWatching = false
}
