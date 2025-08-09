import { switchChain } from '@wagmi/core'
import { UserRejectedRequestError, type Chain } from 'viem'
import { errorToast, warningToast } from '../NotificationToast'
import { wagmiConfig } from '../../libs/web3/wagmi'

export default async function selectNetwork(newNetwork: Chain) {
  try {
    await switchChain(wagmiConfig, { chainId: newNetwork.id })
  } catch (err) {
    console.error(err)
    if (err instanceof UserRejectedRequestError) {
      warningToast('User cancelled switching network.')
    } else {
      errorToast('Failed to switch network.')
    }
  }
}
