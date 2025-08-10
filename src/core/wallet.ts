import { ethers } from 'ethers'
import { SimpleEventEmitter } from '@/utils/emitter'
import { SUPPORTED_CHAINS, ChainConfig } from '../config/chains'

export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balance: string
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
}

export interface SupportedChain {
  id: number
  name: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

// SUPPORTED_CHAINS is imported from '../config/chains'

/**
 * Wallet Manager using pure ethers.js
 * Handles wallet connections, network switching, and account management
 */
export class WalletManager extends SimpleEventEmitter {
  private state: WalletState = {
    isConnected: false,
    address: null,
    chainId: null,
    balance: '0',
    provider: null,
    signer: null
  }

  constructor() {
    super()
    this.setupEventListeners()
  }

  async initialize(): Promise<void> {
    // Check if wallet was previously connected
    const wasConnected = localStorage.getItem('wallet-connected')
    if (wasConnected === 'true' && this.isWalletAvailable()) {
      await this.connectWallet()
    }
  }

  private getAvailableProviders(): { name: string; provider: any }[] {
    const providers = []
    
    if (typeof window !== 'undefined') {
      // Check for OKX Wallet
      if (window.okxwallet?.ethereum) {
        providers.push({ name: 'OKX Wallet', provider: window.okxwallet.ethereum })
      }
      
      // Check for MetaMask
      if (window.ethereum?.isMetaMask) {
        providers.push({ name: 'MetaMask', provider: window.ethereum })
      }
      
      // Check for generic ethereum provider (fallback)
      if (window.ethereum && !window.ethereum.isMetaMask && !window.okxwallet) {
        providers.push({ name: 'Web3 Wallet', provider: window.ethereum })
      }
    }
    
    return providers
  }

  private isWalletAvailable(): boolean {
    return this.getAvailableProviders().length > 0
  }

  private getPreferredProvider(): any {
    const providers = this.getAvailableProviders()
    
    // Prefer OKX wallet first, then MetaMask, then any other
    const okxProvider = providers.find(p => p.name === 'OKX Wallet')
    if (okxProvider) return okxProvider.provider
    
    const metamaskProvider = providers.find(p => p.name === 'MetaMask')
    if (metamaskProvider) return metamaskProvider.provider
    
    return providers[0]?.provider || null
  }

  private setupEventListeners(): void {
    if (!this.isWalletAvailable()) return

    const provider = this.getPreferredProvider()
    if (!provider) return

    // Listen for account changes
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect()
      } else {
        this.handleAccountChange(accounts[0])
      }
    })

    // Listen for chain changes
    provider.on('chainChanged', (chainId: string) => {
      this.handleChainChange(parseInt(chainId, 16))
    })

    // Listen for disconnect
    provider.on('disconnect', () => {
      this.disconnect()
    })
  }

  async connectWallet(): Promise<void> {
    const eip1193 = this.getPreferredProvider()
    if (!eip1193) {
      const availableWallets = this.getAvailableProviders().map(p => p.name).join(', ')
      if (availableWallets) {
        throw new Error(`No compatible wallet found. Available: ${availableWallets}`)
      } else {
        throw new Error('No Web3 wallet detected. Please install MetaMask, OKX Wallet, or another compatible wallet.')
      }
    }

    try {
      // Request account access
      const accounts = await eip1193.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(eip1193)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      // Update state
      this.state = {
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        provider,
        signer
      }

      // Save connection state
      localStorage.setItem('wallet-connected', 'true')

      this.emit('connected', this.state)
      console.log('✅ Wallet connected:', address)
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.state = {
      isConnected: false,
      address: null,
      chainId: null,
      balance: '0',
      provider: null,
      signer: null
    }

    localStorage.removeItem('wallet-connected')
    this.emit('disconnected')
    console.log('🔌 Wallet disconnected')
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!this.isWalletAvailable() || !this.state.isConnected) {
      throw new Error('Wallet not connected')
    }

    const chain = SUPPORTED_CHAINS[chainId]
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    try {
      const eip1193 = this.getPreferredProvider()
      if (!eip1193) throw new Error('Provider not available')
      // Try to switch to the network
      await eip1193.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await this.addNetwork(chain)
      } else {
        throw error
      }
    }
  }

  private async addNetwork(chain: ChainConfig): Promise<void> {
    const eip1193 = this.getPreferredProvider()
    if (!eip1193) throw new Error('Provider not available')
    await eip1193.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chain.id.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: {
          name: chain.symbol,
          symbol: chain.symbol,
          decimals: chain.decimals
        },
        rpcUrls: [chain.rpcUrl],
        blockExplorerUrls: [chain.blockExplorer]
      }]
    })
  }

  private async handleAccountChange(newAddress: string): Promise<void> {
    if (this.state.provider) {
      const balance = await this.state.provider.getBalance(newAddress)
      this.state.address = newAddress
      this.state.balance = ethers.formatEther(balance)
      this.emit('accountChanged', this.state)
    }
  }

  private async handleChainChange(newChainId: number): Promise<void> {
    this.state.chainId = newChainId
    
    if (this.state.provider && this.state.address) {
      const balance = await this.state.provider.getBalance(this.state.address)
      this.state.balance = ethers.formatEther(balance)
    }
    
    this.emit('chainChanged', this.state)
  }

  async updateBalance(): Promise<void> {
    if (this.state.provider && this.state.address) {
      const balance = await this.state.provider.getBalance(this.state.address)
      this.state.balance = ethers.formatEther(balance)
      this.emit('balanceUpdated', this.state)
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    if (!this.state.signer) {
      throw new Error('Wallet not connected')
    }

    const tx = await this.state.signer.sendTransaction(transaction)
    return tx.hash
  }

  async signMessage(message: string): Promise<string> {
    if (!this.state.signer) {
      throw new Error('Wallet not connected')
    }

    return await this.state.signer.signMessage(message)
  }

  getState(): WalletState {
    return { ...this.state }
  }

  isConnected(): boolean {
    return this.state.isConnected
  }

  getAddress(): string | null {
    return this.state.address
  }

  getChainId(): number | null {
    return this.state.chainId
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.state.provider
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.state.signer
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
    okxwallet?: { ethereum?: any }
  }
}