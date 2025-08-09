import { ethers } from 'ethers'

/**
 * Check if wallet is connected
 */
export function checkConnected(): boolean {
  return !!(window as any).ethereum && !!(window as any).ethereum.selectedAddress
}

/**
 * Get the connected wallet address
 */
export async function getConnectedWallet(): Promise<string | null> {
  try {
    if (!(window as any).ethereum) {
      return null
    }

    const accounts = await (window as any).ethereum.request({
      method: 'eth_accounts'
    })

    return accounts.length > 0 ? accounts[0] : null
  } catch (error) {
    console.error('Error getting connected wallet:', error)
    return null
  }
}

/**
 * Get a public client (read-only provider)
 */
export function getPublicClient(chainId?: number): ethers.JsonRpcProvider {
  // Default RPC URLs for different chains
  const rpcUrls: Record<number, string> = {
    1: 'https://eth.llamarpc.com',
    137: 'https://polygon.llamarpc.com',
    56: 'https://bsc.llamarpc.com',
    42161: 'https://arbitrum.llamarpc.com',
    10: 'https://optimism.llamarpc.com',
    8453: 'https://base.llamarpc.com'
  }

  const currentChainId = chainId || 1
  const rpcUrl = rpcUrls[currentChainId] || rpcUrls[1]

  return new ethers.JsonRpcProvider(rpcUrl)
}

/**
 * Get a wallet client (signer)
 */
export async function getWalletClient(): Promise<ethers.Signer | null> {
  try {
    if (!(window as any).ethereum) {
      throw new Error('No wallet found')
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum)
    const signer = await provider.getSigner()
    
    return signer
  } catch (error) {
    console.error('Error getting wallet client:', error)
    return null
  }
}

/**
 * Switch to a specific chain
 */
export async function switchChain(chainId: number): Promise<boolean> {
  try {
    if (!(window as any).ethereum) {
      throw new Error('No wallet found')
    }

    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    })

    return true
  } catch (error: any) {
    // Chain not added to wallet
    if (error.code === 4902) {
      try {
        await addChain(chainId)
        return true
      } catch (addError) {
        console.error('Error adding chain:', addError)
        return false
      }
    }
    
    console.error('Error switching chain:', error)
    return false
  }
}

/**
 * Add a new chain to the wallet
 */
export async function addChain(chainId: number): Promise<void> {
  const chainConfigs: Record<number, any> = {
    137: {
      chainId: '0x89',
      chainName: 'Polygon',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://polygon.llamarpc.com'],
      blockExplorerUrls: ['https://polygonscan.com']
    },
    56: {
      chainId: '0x38',
      chainName: 'BNB Smart Chain',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
      },
      rpcUrls: ['https://bsc.llamarpc.com'],
      blockExplorerUrls: ['https://bscscan.com']
    },
    42161: {
      chainId: '0xa4b1',
      chainName: 'Arbitrum One',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://arbitrum.llamarpc.com'],
      blockExplorerUrls: ['https://arbiscan.io']
    },
    10: {
      chainId: '0xa',
      chainName: 'Optimism',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://optimism.llamarpc.com'],
      blockExplorerUrls: ['https://optimistic.etherscan.io']
    },
    8453: {
      chainId: '0x2105',
      chainName: 'Base',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://base.llamarpc.com'],
      blockExplorerUrls: ['https://basescan.org']
    }
  }

  const config = chainConfigs[chainId]
  if (!config) {
    throw new Error(`Chain ${chainId} not supported`)
  }

  await (window as any).ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [config]
  })
}