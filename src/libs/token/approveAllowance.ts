import type { Address, Hash } from 'viem'
import { erc20Abi } from 'viem'
import getConnectedWallet from '../utils/getConnectedWallet'
import getPublicClient from '../utils/getPublicClient'

type ApproveArgs = {
  account: Address
  address: Address
  spender: Address
  amount: bigint
  chainId?: number
}

export default async function approveAllowance({
  account,
  address,
  spender,
  amount,
  chainId,
}: ApproveArgs): Promise<Hash> {
  const publicClient = getPublicClient(chainId)

  if (!publicClient) {
    throw new Error('Public client not available')
  }

  // Let's first validate the write call by simulating it
  const { request } = await publicClient.simulateContract({
    account,
    address,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, amount],
  })

  const wallet = await getConnectedWallet(chainId)

  const txHash = await wallet.writeContract(request)

  return txHash
}
