import { ethers } from 'ethers'
import { SimpleEventEmitter } from '@/utils/emitter'
import { WalletManager } from './wallet'
import { getBundler, initializeBundler } from '../libs/erc4337/bundler'
import { Token, POPULAR_TOKENS } from '../libs/token/types'
import { approveAllowance } from '../utils/token'
import { getOKXQuote, getOKXSwap, OKXSwapArgs, OKXQuoteArgs } from '../api/okx-dex'
import { getPrivateKey } from '../utils/env'

export interface SwapParams {
  fromToken: Token
  toToken: Token
  amount: string
  slippage: number
  useSmartAccount: boolean
}

export interface SwapQuote {
  fromAmount: string
  toAmount: string
  estimatedGas: string
  priceImpact: string
  route: string[]
}

export interface SwapResult {
  txHash: string
  bundleId?: string
}

/**
 * DEX Aggregator using ethers.js
 * Handles token swaps, quotes, and smart account integration
 */
export class DEXAggregator extends SimpleEventEmitter {
  private walletManager: WalletManager
  private bundlerInitialized = false
  private availableTokens: Token[] = []
  private currentQuote: SwapQuote | null = null

  constructor(walletManager: WalletManager) {
    super()
    this.walletManager = walletManager
    this.setupEventListeners()
  }

  async initialize(): Promise<void> {
    try {
      // Load available tokens
      await this.loadTokens()
      console.log('✅ DEX Aggregator initialized')
    } catch (error) {
      console.error('❌ Failed to initialize DEX Aggregator:', error)
      throw error
    }
  }

  private setupEventListeners(): void {
    this.walletManager.on('chainChanged', () => {
      this.loadTokens()
    })

    // Ensure tokens load on first connection too
    this.walletManager.on('connected', () => {
      this.loadTokens()
    })
  }

  private async loadTokens(): Promise<void> {
    const chainId = this.walletManager.getChainId()
    if (!chainId) return

    try {
      // Use predefined popular tokens per chain
      this.availableTokens = POPULAR_TOKENS[chainId] || []
      this.emit('tokensLoaded', this.availableTokens)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      this.availableTokens = []
    }
  }

  async getQuote(params: Omit<SwapParams, 'useSmartAccount'>): Promise<SwapQuote> {
    const { fromToken, toToken, amount } = params
    const chainId = this.walletManager.getChainId()
    const userAddress = this.walletManager.getAddress()

    if (!chainId || !userAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      const quoteArgs: OKXQuoteArgs = {
        chainId,
        fromTokenAddress: fromToken.address || '',
        toTokenAddress: toToken.address || '',
        amount
      }

      const quoteResponse = await getOKXQuote(quoteArgs)

      this.currentQuote = {
        fromAmount: amount,
        toAmount: quoteResponse.toAmount,
        estimatedGas: quoteResponse.estimatedGas || '0',
        priceImpact: this.calculatePriceImpact(amount, quoteResponse.toAmount),
        route: quoteResponse.route?.map((r: any) => r.protocol) || []
      }

      this.emit('quoteUpdated', this.currentQuote)
      return this.currentQuote
    } catch (error) {
      console.error('Failed to get quote:', error)
      throw new Error('Failed to get swap quote')
    }
  }

  async executeSwap(params: SwapParams): Promise<SwapResult> {
    const { useSmartAccount } = params
    const chainId = this.walletManager.getChainId()
    const userAddress = this.walletManager.getAddress()
    const provider = this.walletManager.getProvider()

    if (!chainId || !userAddress || !provider) {
      throw new Error('Wallet not connected')
    }

    this.emit('swapStarted', params)

    try {
      // Initialize bundler if using smart account
      if (useSmartAccount && !this.bundlerInitialized) {
        await this.initializeBundler()
      }

      if (useSmartAccount && this.bundlerInitialized) {
        return await this.executeSmartAccountSwap(params)
      } else {
        return await this.executeDirectSwap(params)
      }
    } catch (error) {
      this.emit('swapFailed', error)
      throw error
    }
  }

  private async initializeBundler(): Promise<void> {
    const provider = this.walletManager.getProvider()
    if (!provider) throw new Error('Provider not available')

    // Get bundler private key from environment variables with validation
    const bundlerPrivateKey = getPrivateKey('BUNDLER_PRIVATE_KEY')
    
    const bundlerWallet = new ethers.Wallet(bundlerPrivateKey)
    const ethersProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com')

    initializeBundler(
      '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // EntryPoint v0.6
      bundlerWallet,
      ethersProvider
    )

    this.bundlerInitialized = true
  }

  private async executeSmartAccountSwap(params: SwapParams): Promise<SwapResult> {
    const { fromToken, toToken, amount } = params
    const chainId = this.walletManager.getChainId()!
    const userAddress = this.walletManager.getAddress()!

    const bundler = getBundler()
    if (!bundler) {
      throw new Error('Bundler not initialized')
    }

    // Create swap intent with MEV protection
    const intent = await bundler.createSwapIntent(
      userAddress,
      fromToken.address || '',
      toToken.address || '',
      amount,
      chainId
    )

    this.emit('bundleIntentCreated', intent)

    // Wait for bundle execution
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Bundle execution timeout'))
      }, 30000) // 30 second timeout

      const checkBundle = setInterval(async () => {
        const currentIntent = bundler.getIntent(intent.id)
        if (currentIntent?.status === 'executed') {
          clearInterval(checkBundle)
          clearTimeout(timeout)
          resolve({
            txHash: intent.id, // Use intent ID as txHash for mock
            bundleId: intent.id
          })
        } else if (currentIntent?.status === 'failed') {
          clearInterval(checkBundle)
          clearTimeout(timeout)
          reject(new Error('Bundle execution failed'))
        }
      }, 1000)
    })
  }

  private async executeDirectSwap(params: SwapParams): Promise<SwapResult> {
    const { fromToken, toToken, amount, slippage } = params
    const chainId = this.walletManager.getChainId()!
    const userAddress = this.walletManager.getAddress()!

    // Get swap data from OKX
    const swapArgs: OKXSwapArgs = {
      chainId,
      fromTokenAddress: fromToken.address || '',
      toTokenAddress: toToken.address || '',
      amount,
      userWalletAddress: userAddress,
      slippage
    }

    const swapResponse = await getOKXSwap(swapArgs)
    const txData = swapResponse.tx

    // Check and approve token if needed
    const allowanceTarget = txData.to
    const isApproved = await this.checkTokenApproval(fromToken, allowanceTarget, amount)
    if (!isApproved) {
      await this.approveToken(fromToken, allowanceTarget, amount)
    }

    // Execute transaction using wallet manager
    const txHash = await this.walletManager.sendTransaction({
      to: txData.to,
      data: txData.data,
      value: txData.value || '0x0',
      gasLimit: txData.gas || undefined
    })

    this.emit('swapCompleted', { txHash })
    return { txHash }
  }

  private async checkTokenApproval(
    token: Token,
    spender: string,
    amount: string
  ): Promise<boolean> {
    if (token.address === ethers.ZeroAddress) return true

    const signer = this.walletManager.getSigner()
    if (!signer) return false

    const erc20 = new ethers.Contract(
      token.address,
      [
        'function allowance(address owner, address spender) view returns (uint256)'
      ],
      signer
    )

    const owner = await signer.getAddress()
    const allowance = await erc20.allowance(owner, spender)
    const amountWei = ethers.parseUnits(amount, token.decimals)
    return allowance >= amountWei
  }

  private async approveToken(
    token: Token,
    spender: string,
    amount: string
  ): Promise<void> {
    const signer = this.walletManager.getSigner()
    if (!signer) throw new Error('Signer not available')

    await approveAllowance(token.address!, spender, amount, signer)
  }

  private calculatePriceImpact(
    fromAmount: string,
    toAmount: string
  ): string {
    try {
      const from = parseFloat(fromAmount)
      const to = parseFloat(toAmount)
      if (!isFinite(from) || from <= 0) return '0.00'
      const rate = to / from
      const impact = Math.max(0, (1 - rate) * 100)
      return impact.toFixed(2)
    } catch {
      return '0.00'
    }
  }

  getAvailableTokens(): Token[] {
    return this.availableTokens
  }

  getCurrentQuote(): SwapQuote | null {
    return this.currentQuote
  }

  async getTokenBalance(token: Token): Promise<string> {
    const provider = this.walletManager.getProvider()
    const address = this.walletManager.getAddress()
    if (!provider || !address) return '0'

    if (token.address === ethers.ZeroAddress) {
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    }

    const erc20 = new ethers.Contract(
      token.address,
      [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ],
      provider
    )

    const [balance, decimals] = await Promise.all([
      erc20.balanceOf(address),
      erc20.decimals()
    ])

    return ethers.formatUnits(balance, decimals)
  }
}