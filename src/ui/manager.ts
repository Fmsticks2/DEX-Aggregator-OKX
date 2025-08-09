import { WalletManager, SUPPORTED_CHAINS } from '../core/wallet'
import { DEXAggregator, type SwapParams } from '../core/dex'
import { NotificationManager } from './notifications'
import { BundleTracker } from './bundle-tracker'
import type { Token } from '../libs/token/types'
import debounce from 'debounce'

/**
 * UI Manager
 * Handles all user interface interactions and state management
 */
export class UIManager {
  private walletManager: WalletManager
  private dexAggregator: DEXAggregator
  private notificationManager: NotificationManager
  private bundleTracker: BundleTracker
  
  private selectedFromToken: Token | null = null
  private selectedToToken: Token | null = null
  private fromAmount = ''
  private slippage = 0.5
  private useSmartAccount = false
  private isSwapping = false
  
  // UI Elements
  private elements: Record<string, HTMLElement> = {}

  constructor(
    walletManager: WalletManager,
    dexAggregator: DEXAggregator,
    notificationManager: NotificationManager,
    bundleTracker: BundleTracker
  ) {
    this.walletManager = walletManager
    this.dexAggregator = dexAggregator
    this.notificationManager = notificationManager
    this.bundleTracker = bundleTracker
  }

  initialize(): void {
    this.cacheElements()
    this.setupEventListeners()
    this.setupServiceListeners()
    this.updateUI()
    console.log('✅ UI Manager initialized')
  }

  private cacheElements(): void {
    const elementIds = [
      'connect-wallet', 'chain-selector', 'from-amount', 'to-amount',
      'from-token-selector', 'to-token-selector', 'switch-tokens',
      'smart-account-toggle', 'swap-btn', 'swap-btn-text', 'swap-loading',
      'from-balance', 'to-balance', 'tx-info', 'estimated-gas', 'price-impact',
      'token-selector-modal', 'token-search', 'token-list'
    ]

    elementIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        this.elements[id] = element
      } else {
        console.warn(`Element with id '${id}' not found`)
      }
    })
  }

  private setupEventListeners(): void {
    // Wallet connection
    this.elements['connect-wallet']?.addEventListener('click', () => {
      this.handleWalletConnect()
    })

    // Token amount input
    const fromAmountInput = this.elements['from-amount'] as HTMLInputElement
    if (fromAmountInput) {
      fromAmountInput.addEventListener('input', debounce(() => {
        this.handleAmountChange(fromAmountInput.value)
      }, 500))
    }

    // Token selectors
    this.elements['from-token-selector']?.addEventListener('click', () => {
      this.openTokenSelector('from')
    })

    this.elements['to-token-selector']?.addEventListener('click', () => {
      this.openTokenSelector('to')
    })

    // Switch tokens
    this.elements['switch-tokens']?.addEventListener('click', () => {
      this.switchTokens()
    })

    // Smart account toggle
    const smartAccountToggle = this.elements['smart-account-toggle'] as HTMLInputElement
    if (smartAccountToggle) {
      smartAccountToggle.addEventListener('change', () => {
        this.useSmartAccount = smartAccountToggle.checked
        this.updateSwapButton()
      })
    }

    // Swap button
    this.elements['swap-btn']?.addEventListener('click', () => {
      this.handleSwap()
    })

    // Token search
    const tokenSearch = this.elements['token-search'] as HTMLInputElement
    if (tokenSearch) {
      tokenSearch.addEventListener('input', debounce(() => {
        this.filterTokens(tokenSearch.value)
      }, 300))
    }
  }

  private setupServiceListeners(): void {
    // Wallet events
    this.walletManager.on('connected', () => {
      this.updateUI()
      this.notificationManager.showSuccess('Wallet connected successfully')
    })

    this.walletManager.on('disconnected', () => {
      this.updateUI()
      this.notificationManager.showInfo('Wallet disconnected')
    })

    this.walletManager.on('chainChanged', () => {
      this.updateUI()
      this.loadTokenBalances()
    })

    this.walletManager.on('accountChanged', () => {
      this.updateUI()
      this.loadTokenBalances()
    })

    // DEX events
    this.dexAggregator.on('tokensLoaded', (tokens: Token[]) => {
      this.populateTokenList(tokens)
    })

    this.dexAggregator.on('quoteUpdated', (quote) => {
      this.updateQuoteDisplay(quote)
    })

    this.dexAggregator.on('swapStarted', () => {
      this.isSwapping = true
      this.updateSwapButton()
    })

    this.dexAggregator.on('swapExecuted', (result) => {
      this.isSwapping = false
      this.updateSwapButton()
      this.notificationManager.showSuccess(
        `Swap executed! <a href="${this.getExplorerUrl(result.txHash)}" target="_blank">View Transaction</a>`
      )
    })

    this.dexAggregator.on('swapFailed', (error) => {
      this.isSwapping = false
      this.updateSwapButton()
      this.notificationManager.showError(`Swap failed: ${error.message}`)
    })
  }

  private async handleWalletConnect(): Promise<void> {
    try {
      if (this.walletManager.isConnected()) {
        await this.walletManager.disconnect()
      } else {
        await this.walletManager.connectWallet()
      }
    } catch (error: any) {
      this.notificationManager.showError(`Failed to connect wallet: ${error.message}`)
    }
  }

  private async handleAmountChange(amount: string): Promise<void> {
    this.fromAmount = amount
    
    if (this.selectedFromToken && this.selectedToToken && amount && parseFloat(amount) > 0) {
      try {
        await this.dexAggregator.getQuote({
          fromToken: this.selectedFromToken,
          toToken: this.selectedToToken,
          amount,
          slippage: this.slippage
        })
      } catch (error) {
        console.error('Failed to get quote:', error)
      }
    } else {
      this.clearQuoteDisplay()
    }
  }

  private openTokenSelector(type: 'from' | 'to'): void {
    const modal = this.elements['token-selector-modal']
    if (modal) {
      modal.classList.add('modal-open')
      modal.setAttribute('data-token-type', type)
      
      // Focus search input
      const searchInput = this.elements['token-search'] as HTMLInputElement
      if (searchInput) {
        searchInput.value = ''
        searchInput.focus()
      }
      
      // Show all tokens
      this.filterTokens('')
    }
  }

  private switchTokens(): void {
    const temp = this.selectedFromToken
    this.selectedFromToken = this.selectedToToken
    this.selectedToToken = temp
    
    this.updateTokenSelectors()
    this.loadTokenBalances()
    
    if (this.fromAmount) {
      this.handleAmountChange(this.fromAmount)
    }
  }

  private async handleSwap(): Promise<void> {
    if (!this.selectedFromToken || !this.selectedToToken || !this.fromAmount) {
      this.notificationManager.showError('Please select tokens and enter amount')
      return
    }

    if (!this.walletManager.isConnected()) {
      this.notificationManager.showError('Please connect your wallet')
      return
    }

    const swapParams: SwapParams = {
      fromToken: this.selectedFromToken,
      toToken: this.selectedToToken,
      amount: this.fromAmount,
      slippage: this.slippage,
      useSmartAccount: this.useSmartAccount
    }

    try {
      await this.dexAggregator.executeSwap(swapParams)
    } catch (error: any) {
      this.notificationManager.showError(`Swap failed: ${error.message}`)
    }
  }

  private populateTokenList(tokens: Token[]): void {
    const tokenList = this.elements['token-list']
    if (!tokenList) return

    tokenList.innerHTML = ''
    
    tokens.forEach(token => {
      const tokenItem = this.createTokenListItem(token)
      tokenList.appendChild(tokenItem)
    })
  }

  private createTokenListItem(token: Token): HTMLElement {
    const item = document.createElement('div')
    item.className = 'flex items-center space-x-3 p-3 hover:bg-base-200 cursor-pointer rounded-lg'
    
    item.innerHTML = `
      <div class="avatar">
        <div class="w-8 h-8 rounded-full">
          <img src="${token.logoURI || '/default-token.svg'}" alt="${token.symbol}" />
        </div>
      </div>
      <div class="flex-1">
        <div class="font-medium">${token.symbol}</div>
        <div class="text-sm text-base-content/60">${token.name}</div>
      </div>
      <div class="text-right">
        <div class="font-medium" data-token-balance="${token.address}">0</div>
      </div>
    `
    
    item.addEventListener('click', () => {
      this.selectToken(token)
    })
    
    return item
  }

  private selectToken(token: Token): void {
    const modal = this.elements['token-selector-modal']
    const tokenType = modal?.getAttribute('data-token-type')
    
    if (tokenType === 'from') {
      this.selectedFromToken = token
    } else if (tokenType === 'to') {
      this.selectedToToken = token
    }
    
    this.updateTokenSelectors()
    this.loadTokenBalances()
    
    // Close modal
    modal?.classList.remove('modal-open')
    
    // Update quote if both tokens selected
    if (this.selectedFromToken && this.selectedToToken && this.fromAmount) {
      this.handleAmountChange(this.fromAmount)
    }
  }

  private filterTokens(query: string): void {
    const tokens = this.dexAggregator.getAvailableTokens()
    const filteredTokens = tokens.filter(token => 
      token.name.toLowerCase().includes(query.toLowerCase()) ||
      token.symbol.toLowerCase().includes(query.toLowerCase())
    )
    
    this.populateTokenList(filteredTokens)
  }

  private updateUI(): void {
    this.updateWalletButton()
    this.updateChainSelector()
    this.updateSwapButton()
    this.loadTokenBalances()
  }

  private updateWalletButton(): void {
    const button = this.elements['connect-wallet']
    if (!button) return

    const walletState = this.walletManager.getState()
    
    if (walletState.isConnected && walletState.address) {
      button.textContent = `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`
      button.className = 'btn btn-outline'
    } else {
      button.textContent = 'Connect Wallet'
      button.className = 'btn btn-primary'
    }
  }

  private updateChainSelector(): void {
    const selector = this.elements['chain-selector']
    if (!selector) return

    const chainId = this.walletManager.getChainId()
    const chain = chainId ? SUPPORTED_CHAINS[chainId] : null
    
    if (chain) {
      selector.innerHTML = `
        <div class="flex items-center space-x-2">
          <span>${chain.name}</span>
        </div>
      `
    } else {
      selector.innerHTML = '<span>Select Network</span>'
    }
  }

  private updateTokenSelectors(): void {
    this.updateTokenSelector('from', this.selectedFromToken)
    this.updateTokenSelector('to', this.selectedToToken)
  }

  private updateTokenSelector(type: 'from' | 'to', token: Token | null): void {
    const selector = this.elements[`${type}-token-selector`]
    if (!selector) return

    if (token) {
      selector.innerHTML = `
        <div class="flex items-center space-x-2">
          <img src="${token.logoURI || '/default-token.svg'}" alt="${token.symbol}" class="w-6 h-6 rounded-full" />
          <span>${token.symbol}</span>
        </div>
      `
    } else {
      selector.innerHTML = '<span>Select Token</span>'
    }
  }

  private updateSwapButton(): void {
    const button = this.elements['swap-btn']
    const buttonText = this.elements['swap-btn-text']
    const loading = this.elements['swap-loading']
    
    if (!button || !buttonText || !loading) return

    if (this.isSwapping) {
      button.setAttribute('disabled', 'true')
      buttonText.textContent = 'Swapping...'
      loading.classList.remove('hidden')
    } else if (!this.walletManager.isConnected()) {
      button.setAttribute('disabled', 'true')
      buttonText.textContent = 'Connect Wallet'
      loading.classList.add('hidden')
    } else if (!this.selectedFromToken || !this.selectedToToken) {
      button.setAttribute('disabled', 'true')
      buttonText.textContent = 'Select Tokens'
      loading.classList.add('hidden')
    } else if (!this.fromAmount || parseFloat(this.fromAmount) <= 0) {
      button.setAttribute('disabled', 'true')
      buttonText.textContent = 'Enter Amount'
      loading.classList.add('hidden')
    } else {
      button.removeAttribute('disabled')
      buttonText.textContent = this.useSmartAccount ? 'Swap with MEV Protection' : 'Swap'
      loading.classList.add('hidden')
    }
  }

  private updateQuoteDisplay(quote: any): void {
    const toAmountInput = this.elements['to-amount'] as HTMLInputElement
    const txInfo = this.elements['tx-info']
    const estimatedGas = this.elements['estimated-gas']
    const priceImpact = this.elements['price-impact']

    if (toAmountInput) {
      toAmountInput.value = parseFloat(quote.toAmount).toFixed(6)
    }

    if (txInfo) {
      txInfo.classList.remove('hidden')
    }

    if (estimatedGas) {
      estimatedGas.textContent = `${parseInt(quote.estimatedGas).toLocaleString()} gas`
    }

    if (priceImpact) {
      priceImpact.textContent = `${quote.priceImpact}%`
    }
  }

  private clearQuoteDisplay(): void {
    const toAmountInput = this.elements['to-amount'] as HTMLInputElement
    const txInfo = this.elements['tx-info']

    if (toAmountInput) {
      toAmountInput.value = ''
    }

    if (txInfo) {
      txInfo.classList.add('hidden')
    }
  }

  private async loadTokenBalances(): Promise<void> {
    if (!this.walletManager.isConnected()) return

    // Update native token balance
    const walletState = this.walletManager.getState()
    const fromBalance = this.elements['from-balance']
    const toBalance = this.elements['to-balance']

    if (fromBalance && this.selectedFromToken) {
      try {
        const balance = await this.dexAggregator.getTokenBalance(this.selectedFromToken)
        fromBalance.textContent = `Balance: ${parseFloat(balance).toFixed(4)}`
      } catch (error) {
        fromBalance.textContent = 'Balance: 0'
      }
    }

    if (toBalance && this.selectedToToken) {
      try {
        const balance = await this.dexAggregator.getTokenBalance(this.selectedToToken)
        toBalance.textContent = `Balance: ${parseFloat(balance).toFixed(4)}`
      } catch (error) {
        toBalance.textContent = 'Balance: 0'
      }
    }
  }

  private getExplorerUrl(txHash: string): string {
    const chainId = this.walletManager.getChainId()
    const chain = chainId ? SUPPORTED_CHAINS[chainId] : null
    return chain ? `${chain.blockExplorer}/tx/${txHash}` : '#'
  }
}