import { ethers } from 'ethers'
import { Token, TokenBalance } from '../libs/token/types'

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
]

/**
 * Get token balance for an address
 */
export async function getBalance(
  tokenAddress: string,
  userAddress: string,
  provider: ethers.Provider,
  chainId: number = 1
): Promise<TokenBalance> {
  try {
    if (tokenAddress === ethers.ZeroAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      // Native token (ETH)
      const balance = await provider.getBalance(userAddress)
      return {
        token: {
          address: ethers.ZeroAddress,
          symbol: 'ETH',
          decimals: 18,
          name: 'Ethereum',
          chainId
        },
        balance: balance.toString(),
        formattedBalance: ethers.formatEther(balance)
      }
    } else {
      // ERC20 token
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      
      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals(),
        contract.symbol(),
        contract.name()
      ])

      return {
        token: {
          address: tokenAddress,
          symbol,
          decimals,
          name,
          chainId
        },
        balance: balance.toString(),
        formattedBalance: ethers.formatUnits(balance, decimals)
      }
    }
  } catch (error) {
    console.error('Error getting token balance:', error)
    throw error
  }
}

/**
 * Approve token allowance
 */
export async function approveAllowance(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  try {
    if (tokenAddress === ethers.ZeroAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      throw new Error('Cannot approve native token')
    }

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
    const tx = await contract.approve(spenderAddress, amount)
    
    return tx
  } catch (error) {
    console.error('Error approving token allowance:', error)
    throw error
  }
}

/**
 * Check token allowance
 */
export async function checkAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  provider: ethers.Provider
): Promise<string> {
  try {
    if (tokenAddress === ethers.ZeroAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return ethers.MaxUint256.toString() // Native token doesn't need approval
    }

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const allowance = await contract.allowance(ownerAddress, spenderAddress)
    
    return allowance.toString()
  } catch (error) {
    console.error('Error checking token allowance:', error)
    throw error
  }
}

/**
 * Get token information
 */
export async function getTokenInfo(
  tokenAddress: string,
  provider: ethers.Provider,
  chainId: number = 1
): Promise<Token> {
  try {
    if (tokenAddress === ethers.ZeroAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return {
        address: ethers.ZeroAddress,
        symbol: 'ETH',
        decimals: 18,
        name: 'Ethereum',
        chainId
      }
    }

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    
    const [decimals, symbol, name] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.name()
    ])

    return {
      address: tokenAddress,
      symbol,
      decimals,
      name,
      chainId
    }
  } catch (error) {
    console.error('Error getting token info:', error)
    throw error
  }
}