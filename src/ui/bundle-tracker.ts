import { EventEmitter } from 'events'
import type { UserOperation, Bundle } from '../libs/erc4337/types'

/**
 * Bundle Tracker
 * Monitors and displays MEV protection and transaction bundling status
 */
export class BundleTracker extends EventEmitter {
  private container: HTMLElement | null = null
  private activeBundles: Map<string, Bundle> = new Map()
  private userOperations: Map<string, UserOperation> = new Map()
  private isVisible = false

  constructor() {
    super()
  }

  initialize(): void {
    this.container = document.getElementById('bundle-tracker')
    if (!this.container) {
      console.warn('Bundle tracker container not found')
      return
    }

    this.setupUI()
    console.log('✅ Bundle Tracker initialized')
  }

  private setupUI(): void {
    if (!this.container) return

    this.container.innerHTML = `
      <div class="card bg-base-100 shadow-lg">
        <div class="card-header">
          <h3 class="card-title text-lg font-semibold">MEV Protection Status</h3>
          <button id="bundle-tracker-toggle" class="btn btn-ghost btn-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
        <div id="bundle-tracker-content" class="card-body ${this.isVisible ? '' : 'hidden'}">
          <div id="bundle-stats" class="stats stats-horizontal shadow mb-4">
            <div class="stat">
              <div class="stat-title">Active Bundles</div>
              <div class="stat-value text-primary" id="active-bundles-count">0</div>
            </div>
            <div class="stat">
              <div class="stat-title">Pending Ops</div>
              <div class="stat-value text-secondary" id="pending-ops-count">0</div>
            </div>
            <div class="stat">
              <div class="stat-title">MEV Saved</div>
              <div class="stat-value text-success" id="mev-saved">$0</div>
            </div>
          </div>
          
          <div id="bundle-list" class="space-y-3">
            <div id="no-bundles" class="text-center text-base-content/60 py-8">
              <svg class="w-12 h-12 mx-auto mb-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              <p>No active bundles</p>
              <p class="text-sm">Enable smart account for MEV protection</p>
            </div>
          </div>
        </div>
      </div>
    `

    // Setup toggle functionality
    const toggleButton = document.getElementById('bundle-tracker-toggle')
    const content = document.getElementById('bundle-tracker-content')
    
    if (toggleButton && content) {
      toggleButton.addEventListener('click', () => {
        this.isVisible = !this.isVisible
        content.classList.toggle('hidden', !this.isVisible)
        
        const icon = toggleButton.querySelector('svg')
        if (icon) {
          icon.style.transform = this.isVisible ? 'rotate(180deg)' : 'rotate(0deg)'
        }
      })
    }
  }

  // Track a new user operation
  trackUserOperation(userOp: UserOperation): void {
    this.userOperations.set(userOp.hash, userOp)
    this.updateStats()
    this.addUserOperationToUI(userOp)
    this.emit('userOperationAdded', userOp)
  }

  // Track a new bundle
  trackBundle(bundle: Bundle): void {
    this.activeBundles.set(bundle.id, bundle)
    this.updateStats()
    this.addBundleToUI(bundle)
    this.emit('bundleAdded', bundle)
  }

  // Update user operation status
  updateUserOperationStatus(hash: string, status: 'pending' | 'included' | 'failed', txHash?: string): void {
    const userOp = this.userOperations.get(hash)
    if (!userOp) return

    userOp.status = status
    if (txHash) {
      userOp.txHash = txHash
    }

    this.updateUserOperationInUI(userOp)
    this.updateStats()
    this.emit('userOperationUpdated', userOp)
  }

  // Update bundle status
  updateBundleStatus(bundleId: string, status: 'pending' | 'submitted' | 'confirmed' | 'failed', txHash?: string): void {
    const bundle = this.activeBundles.get(bundleId)
    if (!bundle) return

    bundle.status = status
    if (txHash) {
      bundle.txHash = txHash
    }

    this.updateBundleInUI(bundle)
    this.updateStats()
    this.emit('bundleUpdated', bundle)

    // Remove completed bundles after delay
    if (status === 'confirmed' || status === 'failed') {
      setTimeout(() => {
        this.removeBundle(bundleId)
      }, 10000) // Remove after 10 seconds
    }
  }

  // Add MEV savings data
  addMEVSavings(amount: number, currency = 'USD'): void {
    const currentSavings = this.getTotalMEVSavings()
    const newTotal = currentSavings + amount
    
    localStorage.setItem('mev-savings', newTotal.toString())
    this.updateStats()
    this.emit('mevSavingsUpdated', newTotal)
  }

  private updateStats(): void {
    const activeBundlesCount = document.getElementById('active-bundles-count')
    const pendingOpsCount = document.getElementById('pending-ops-count')
    const mevSaved = document.getElementById('mev-saved')

    if (activeBundlesCount) {
      activeBundlesCount.textContent = this.activeBundles.size.toString()
    }

    if (pendingOpsCount) {
      const pendingOps = Array.from(this.userOperations.values())
        .filter(op => op.status === 'pending').length
      pendingOpsCount.textContent = pendingOps.toString()
    }

    if (mevSaved) {
      const totalSavings = this.getTotalMEVSavings()
      mevSaved.textContent = `$${totalSavings.toFixed(2)}`
    }
  }

  private addUserOperationToUI(userOp: UserOperation): void {
    const bundleList = document.getElementById('bundle-list')
    const noBundles = document.getElementById('no-bundles')
    
    if (!bundleList) return

    // Hide "no bundles" message
    if (noBundles) {
      noBundles.classList.add('hidden')
    }

    const opElement = this.createUserOperationElement(userOp)
    bundleList.appendChild(opElement)
  }

  private addBundleToUI(bundle: Bundle): void {
    const bundleList = document.getElementById('bundle-list')
    const noBundles = document.getElementById('no-bundles')
    
    if (!bundleList) return

    // Hide "no bundles" message
    if (noBundles) {
      noBundles.classList.add('hidden')
    }

    const bundleElement = this.createBundleElement(bundle)
    bundleList.appendChild(bundleElement)
  }

  private createUserOperationElement(userOp: UserOperation): HTMLElement {
    const element = document.createElement('div')
    element.id = `user-op-${userOp.hash}`
    element.className = 'card bg-base-200 p-4'
    
    element.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="${this.getStatusBadgeClass(userOp.status)}">
            ${this.getStatusIcon(userOp.status)}
          </div>
          <div>
            <div class="font-medium">User Operation</div>
            <div class="text-sm text-base-content/60">${userOp.hash.slice(0, 10)}...${userOp.hash.slice(-8)}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-medium">${this.getStatusText(userOp.status)}</div>
          <div class="text-xs text-base-content/60">${this.formatTimestamp(userOp.timestamp)}</div>
        </div>
      </div>
      ${userOp.txHash ? `
        <div class="mt-3 pt-3 border-t border-base-300">
          <a href="${this.getExplorerUrl(userOp.txHash)}" target="_blank" class="link link-primary text-sm">
            View Transaction
          </a>
        </div>
      ` : ''}
    `
    
    return element
  }

  private createBundleElement(bundle: Bundle): HTMLElement {
    const element = document.createElement('div')
    element.id = `bundle-${bundle.id}`
    element.className = 'card bg-base-200 p-4'
    
    element.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="${this.getStatusBadgeClass(bundle.status)}">
            ${this.getStatusIcon(bundle.status)}
          </div>
          <div>
            <div class="font-medium">Bundle #${bundle.id.slice(-6)}</div>
            <div class="text-sm text-base-content/60">${bundle.userOperations.length} operations</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-medium">${this.getStatusText(bundle.status)}</div>
          <div class="text-xs text-base-content/60">${this.formatTimestamp(bundle.timestamp)}</div>
        </div>
      </div>
      
      <div class="mt-3">
        <div class="flex items-center justify-between text-sm">
          <span>MEV Protection:</span>
          <span class="badge badge-success">Active</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-1">
          <span>Fair Ordering:</span>
          <span class="badge badge-info">ZK-Proof</span>
        </div>
      </div>
      
      ${bundle.txHash ? `
        <div class="mt-3 pt-3 border-t border-base-300">
          <a href="${this.getExplorerUrl(bundle.txHash)}" target="_blank" class="link link-primary text-sm">
            View Bundle Transaction
          </a>
        </div>
      ` : ''}
    `
    
    return element
  }

  private updateUserOperationInUI(userOp: UserOperation): void {
    const element = document.getElementById(`user-op-${userOp.hash}`)
    if (!element) return

    const statusBadge = element.querySelector('.badge')
    const statusText = element.querySelector('.text-right .text-sm')
    
    if (statusBadge) {
      statusBadge.className = this.getStatusBadgeClass(userOp.status)
      statusBadge.innerHTML = this.getStatusIcon(userOp.status)
    }
    
    if (statusText) {
      statusText.textContent = this.getStatusText(userOp.status)
    }

    // Add transaction link if available
    if (userOp.txHash && !element.querySelector('.link')) {
      const linkContainer = document.createElement('div')
      linkContainer.className = 'mt-3 pt-3 border-t border-base-300'
      linkContainer.innerHTML = `
        <a href="${this.getExplorerUrl(userOp.txHash)}" target="_blank" class="link link-primary text-sm">
          View Transaction
        </a>
      `
      element.appendChild(linkContainer)
    }
  }

  private updateBundleInUI(bundle: Bundle): void {
    const element = document.getElementById(`bundle-${bundle.id}`)
    if (!element) return

    const statusBadge = element.querySelector('.badge')
    const statusText = element.querySelector('.text-right .text-sm')
    
    if (statusBadge) {
      statusBadge.className = this.getStatusBadgeClass(bundle.status)
      statusBadge.innerHTML = this.getStatusIcon(bundle.status)
    }
    
    if (statusText) {
      statusText.textContent = this.getStatusText(bundle.status)
    }

    // Add transaction link if available
    if (bundle.txHash && !element.querySelector('.link')) {
      const linkContainer = document.createElement('div')
      linkContainer.className = 'mt-3 pt-3 border-t border-base-300'
      linkContainer.innerHTML = `
        <a href="${this.getExplorerUrl(bundle.txHash)}" target="_blank" class="link link-primary text-sm">
          View Bundle Transaction
        </a>
      `
      element.appendChild(linkContainer)
    }
  }

  private removeBundle(bundleId: string): void {
    const element = document.getElementById(`bundle-${bundleId}`)
    if (element) {
      element.remove()
    }
    
    this.activeBundles.delete(bundleId)
    this.updateStats()
    
    // Show "no bundles" message if no active bundles
    if (this.activeBundles.size === 0 && this.userOperations.size === 0) {
      const noBundles = document.getElementById('no-bundles')
      if (noBundles) {
        noBundles.classList.remove('hidden')
      }
    }
  }

  private getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge badge-warning'
      case 'submitted':
      case 'included':
        return 'badge badge-info'
      case 'confirmed':
        return 'badge badge-success'
      case 'failed':
        return 'badge badge-error'
      default:
        return 'badge badge-ghost'
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`
      case 'submitted':
      case 'included':
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"></path></svg>`
      case 'confirmed':
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`
      case 'failed':
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`
      default:
        return ''
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'submitted':
        return 'Submitted'
      case 'included':
        return 'Included'
      case 'confirmed':
        return 'Confirmed'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  private getExplorerUrl(txHash: string): string {
    // This should be updated based on the current network
    return `https://etherscan.io/tx/${txHash}`
  }

  private getTotalMEVSavings(): number {
    const saved = localStorage.getItem('mev-savings')
    return saved ? parseFloat(saved) : 0
  }

  // Public methods for external use
  show(): void {
    if (this.container) {
      this.container.classList.remove('hidden')
    }
  }

  hide(): void {
    if (this.container) {
      this.container.classList.add('hidden')
    }
  }

  clear(): void {
    this.activeBundles.clear()
    this.userOperations.clear()
    
    const bundleList = document.getElementById('bundle-list')
    if (bundleList) {
      bundleList.innerHTML = `
        <div id="no-bundles" class="text-center text-base-content/60 py-8">
          <svg class="w-12 h-12 mx-auto mb-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <p>No active bundles</p>
          <p class="text-sm">Enable smart account for MEV protection</p>
        </div>
      `
    }
    
    this.updateStats()
  }
}