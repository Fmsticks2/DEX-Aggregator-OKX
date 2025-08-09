import { getBalance as wagmiGetBalance } from '@wagmi/core'
import type { Address } from 'viem'
import { wagmiConfig } from '../web3/wagmi'
import checkConnected from '../utils/checkConnected'
import { get } from 'svelte/store'
import { account } from '../../stores/account'

type GetBalanceArgs = {
  // Address of balance to check
  address?: Address
  // Chain id to use for Public Client
  chainId?: number
  // ERC-20 address
  token?: Address
}

export default async function getBalance({ address, chainId, token }: GetBalanceArgs) {
  checkConnected()

  let userAddress: Address

  if (address) {
    userAddress = address
  } else {
    const $account = get(account)

    // If no address is passed, we use the current wallet address
    if ($account.address) {
      userAddress = $account.address as Address
    } else {
      throw new Error('No user address has been provided')
    }
  }

  return wagmiGetBalance(wagmiConfig, {
    address: userAddress,
    chainId,
    token,
  })
}
