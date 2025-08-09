import { ethers } from 'ethers'
import { EventEmitter } from 'events'
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
export class WalletManager extends EventEmitter {
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
    if (wasConnected === 'true' && this.isMetaMaskAvailable()) {
      await this.connectWallet()
    }
  }

  private isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  private setupEventListeners(): void {
    if (!this.isMetaMaskAvailable()) return

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect()
      } else {
        this.handleAccountChange(accounts[0])
      }
    })

    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      this.handleChainChange(parseInt(chainId, 16))
    })

    // Listen for disconnect
    window.ethereum.on('disconnect', () => {
      this.disconnect()
    })
  }

  async connectWallet(): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
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
    if (!this.isMetaMaskAvailable() || !this.state.isConnected) {
      throw new Error('Wallet not connected')
    }

    const chain = SUPPORTED_CHAINS[chainId]
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
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
    await window.ethereum.request({
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
  }
}