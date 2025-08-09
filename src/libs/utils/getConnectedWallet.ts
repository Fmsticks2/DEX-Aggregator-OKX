import { getWalletClient } from '@wagmi/core'
import { wagmiConfig } from '../web3/wagmi'

export default async function getConnectedWallet(chainId?: number) {
  const walletClient = await getWalletClient(wagmiConfig, { chainId })

  if (!walletClient) {
    throw new Error('No wallet connected')
  }

  return walletClient
}
