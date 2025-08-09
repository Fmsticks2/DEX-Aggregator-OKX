import { ethers } from 'ethers'
import { EventEmitter } from 'events'
import { WalletManager } from './wallet'
import { SmartAccountBundler, getBundler, initializeBundler } from '../libs/erc4337/bundler'
import { getOKXQuote, getOKXSwap } from '../libs/api/okx-dex'
import type { OKXQuoteArgs, OKXSwapArgs } from '../libs/api/types'
import { approveAllowance } from '../libs/token/approveAllowance'
import { fetchAllTokens } from '../libs/token/fetchAllTokens'
import type { Token, ERC20Token } from '../libs/token/types'

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
export class DEXAggregator extends EventEmitter {
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
  }

  private async loadTokens(): Promise<void> {
    const chainId = this.walletManager.getChainId()
    if (!chainId) return

    try {
      this.availableTokens = await fetchAllTokens(chainId)
      this.emit('tokensLoaded', this.availableTokens)
    } catch (error) {
      console.error('Failed to load tokens:', error)
      this.availableTokens = []
    }
  }

  async getQuote(params: Omit<SwapParams, 'useSmartAccount'>): Promise<SwapQuote> {
    const { fromToken, toToken, amount, slippage } = params
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
        amount,
        userWalletAddress: userAddress
      }

      const quoteResponse = await getOKXQuote(quoteArgs)
      const quote = quoteResponse.data[0]

      this.currentQuote = {
        fromAmount: amount,
        toAmount: quote.routerResult.toTokenAmount,
        estimatedGas: quote.routerResult.estimatedGas || '0',
        priceImpact: this.calculatePriceImpact(amount, quote.routerResult.toTokenAmount, fromToken, toToken),
        route: quote.routerResult.subRoutes?.map(r => r.dexName) || []
      }

      this.emit('quoteUpdated', this.currentQuote)
      return this.currentQuote
    } catch (error) {
      console.error('Failed to get quote:', error)
      throw new Error('Failed to get swap quote')
    }
  }

  async executeSwap(params: SwapParams): Promise<SwapResult> {
    const { fromToken, toToken, amount, slippage, useSmartAccount } = params
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

    // Demo bundler wallet - in production, use proper key management
    const bundlerPrivateKey = '0x' + '1'.repeat(64)
    const bundlerWallet = new ethers.Wallet(bundlerPrivateKey)
    const ethersProvider = new ethers.JsonRpcProvider(provider.provider.request)

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
            txHash: currentIntent.txHash || '',
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
    const txData = swapResponse.data[0].tx

    // Check if token approval is needed
    if (fromToken.address && fromToken.address !== ethers.ZeroAddress) {
      const needsApproval = await this.checkTokenApproval(
        fromToken as ERC20Token,
        txData.to,
        amount
      )

      if (needsApproval) {
        await this.approveToken(fromToken as ERC20Token, txData.to, amount)
      }
    }

    // Execute swap transaction
    const txRequest: ethers.TransactionRequest = {
      to: txData.to,
      data: txData.data,
      value: txData.value || '0',
      gasLimit: txData.gas,
      gasPrice: txData.gasPrice
    }

    const txHash = await this.walletManager.sendTransaction(txRequest)
    this.emit('swapExecuted', { txHash })

    return { txHash }
  }

  private async checkTokenApproval(
    token: ERC20Token,
    spender: string,
    amount: string
  ): Promise<boolean> {
    const provider = this.walletManager.getProvider()
    const userAddress = this.walletManager.getAddress()

    if (!provider || !userAddress) return false

    try {
      const tokenContract = new ethers.Contract(
        token.address,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        provider
      )

      const allowance = await tokenContract.allowance(userAddress, spender)
      const requiredAmount = ethers.parseUnits(amount, token.decimals)

      return allowance < requiredAmount
    } catch (error) {
      console.error('Failed to check token approval:', error)
      return true // Assume approval needed on error
    }
  }

  private async approveToken(
    token: ERC20Token,
    spender: string,
    amount: string
  ): Promise<void> {
    const chainId = this.walletManager.getChainId()!
    const userAddress = this.walletManager.getAddress()!

    await approveAllowance({
      chainId,
      tokenAddress: token.address,
      spenderAddress: spender,
      amount,
      userWalletAddress: userAddress
    })
  }

  private calculatePriceImpact(
    fromAmount: string,
    toAmount: string,
    fromToken: Token,
    toToken: Token
  ): string {
    // Simplified price impact calculation
    // In a real implementation, you'd use market prices
    try {
      const fromValue = parseFloat(fromAmount)
      const toValue = parseFloat(toAmount)
      
      if (fromValue === 0 || toValue === 0) return '0'
      
      // This is a placeholder - real price impact needs market data
      const impact = Math.abs((fromValue - toValue) / fromValue) * 100
      return impact.toFixed(2)
    } catch {
      return '0'
    }
  }

  getAvailableTokens(): Token[] {
    return [...this.availableTokens]
  }

  getCurrentQuote(): SwapQuote | null {
    return this.currentQuote
  }

  async getTokenBalance(token: Token): Promise<string> {
    const provider = this.walletManager.getProvider()
    const userAddress = this.walletManager.getAddress()

    if (!provider || !userAddress) return '0'

    try {
      if (!token.address || token.address === ethers.ZeroAddress) {
        // Native token (ETH, MATIC, etc.)
        const balance = await provider.getBalance(userAddress)
        return ethers.formatEther(balance)
      } else {
        // ERC20 token
        const tokenContract = new ethers.Contract(
          token.address,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        )
        const balance = await tokenContract.balanceOf(userAddress)
        return ethers.formatUnits(balance, token.decimals)
      }
    } catch (error) {
      console.error('Failed to get token balance:', error)
      return '0'
    }
  }
}