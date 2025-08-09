/**
 * Notification Manager
 * Handles toast notifications and user feedback
 */
export class NotificationManager {
  private container: HTMLElement
  private notifications: Map<string, HTMLElement> = new Map()
  private notificationId = 0

  constructor() {
    this.container = this.createContainer()
    document.body.appendChild(this.container)
  }

  initialize(): void {
    console.log('✅ Notification Manager initialized')
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'notification-container'
    container.className = 'toast toast-top toast-end z-50'
    return container
  }

  showSuccess(message: string, duration = 5000): string {
    return this.showNotification(message, 'success', duration)
  }

  showError(message: string, duration = 8000): string {
    return this.showNotification(message, 'error', duration)
  }

  showWarning(message: string, duration = 6000): string {
    return this.showNotification(message, 'warning', duration)
  }

  showInfo(message: string, duration = 4000): string {
    return this.showNotification(message, 'info', duration)
  }

  showLoading(message: string): string {
    return this.showNotification(message, 'loading', 0) // 0 duration means persistent
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' | 'loading', duration: number): string {
    const id = `notification-${++this.notificationId}`
    const notification = this.createNotification(id, message, type)
    
    this.notifications.set(id, notification)
    this.container.appendChild(notification)
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('notification-enter')
    })
    
    // Auto-remove after duration (if not persistent)
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(id)
      }, duration)
    }
    
    return id
  }

  private createNotification(id: string, message: string, type: string): HTMLElement {
    const notification = document.createElement('div')
    notification.id = id
    notification.className = `alert notification-item ${this.getAlertClass(type)}`
    
    const icon = this.getIcon(type)
    const closeButton = type !== 'loading' ? this.createCloseButton(id) : ''
    
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm">${message}</div>
        </div>
        ${closeButton}
      </div>
    `
    
    return notification
  }

  private getAlertClass(type: string): string {
    switch (type) {
      case 'success':
        return 'alert-success'
      case 'error':
        return 'alert-error'
      case 'warning':
        return 'alert-warning'
      case 'info':
        return 'alert-info'
      case 'loading':
        return 'alert-info'
      default:
        return 'alert-info'
    }
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success':
        return `
          <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        `
      case 'error':
        return `
          <svg class="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
        `
      case 'warning':
        return `
          <svg class="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
        `
      case 'info':
        return `
          <svg class="w-5 h-5 text-info" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
        `
      case 'loading':
        return `
          <svg class="w-5 h-5 text-info animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        `
      default:
        return ''
    }
  }

  private createCloseButton(id: string): string {
    return `
      <button class="btn btn-ghost btn-xs" onclick="window.notificationManager?.removeNotification('${id}')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `
  }

  removeNotification(id: string): void {
    const notification = this.notifications.get(id)
    if (!notification) return
    
    // Animate out
    notification.classList.add('notification-exit')
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      this.notifications.delete(id)
    }, 300) // Match animation duration
  }

  updateNotification(id: string, message: string, type?: 'success' | 'error' | 'warning' | 'info'): void {
    const notification = this.notifications.get(id)
    if (!notification) return
    
    const messageElement = notification.querySelector('.text-sm')
    if (messageElement) {
      messageElement.innerHTML = message
    }
    
    if (type) {
      // Update alert class
      notification.className = `alert notification-item ${this.getAlertClass(type)}`
      
      // Update icon
      const iconElement = notification.querySelector('.flex-shrink-0')
      if (iconElement) {
        iconElement.innerHTML = this.getIcon(type)
      }
    }
  }

  clearAll(): void {
    this.notifications.forEach((_, id) => {
      this.removeNotification(id)
    })
  }

  // Transaction-specific notifications
  showTransactionPending(txHash: string, explorerUrl: string): string {
    const message = `
      Transaction pending...
      <a href="${explorerUrl}/tx/${txHash}" target="_blank" class="link link-primary">
        View on Explorer
      </a>
    `
    return this.showLoading(message)
  }

  showTransactionSuccess(txHash: string, explorerUrl: string): string {
    const message = `
      Transaction confirmed!
      <a href="${explorerUrl}/tx/${txHash}" target="_blank" class="link link-primary">
        View on Explorer
      </a>
    `
    return this.showSuccess(message)
  }

  showTransactionFailed(txHash: string, explorerUrl: string, error: string): string {
    const message = `
      Transaction failed: ${error}
      <a href="${explorerUrl}/tx/${txHash}" target="_blank" class="link link-primary">
        View on Explorer
      </a>
    `
    return this.showError(message)
  }

  // Wallet-specific notifications
  showWalletConnecting(): string {
    return this.showLoading('Connecting to wallet...')
  }

  showNetworkSwitching(networkName: string): string {
    return this.showLoading(`Switching to ${networkName}...`)
  }

  showApprovalPending(tokenSymbol: string): string {
    return this.showLoading(`Approving ${tokenSymbol}...`)
  }

  showSwapPending(): string {
    return this.showLoading('Executing swap...')
  }
}

// Global reference for inline event handlers
declare global {
  interface Window {
    notificationManager?: NotificationManager
  }
}

// CSS for animations (to be added to main.css)
export const notificationStyles = `
.notification-item {
  transform: translateX(100%);
  transition: all 0.3s ease-in-out;
  margin-bottom: 0.5rem;
  max-width: 400px;
}

.notification-enter {
  transform: translateX(0);
}

.notification-exit {
  transform: translateX(100%);
  opacity: 0;
}

.notification-item .link {
  text-decoration: underline;
  font-weight: 500;
}

.notification-item .link:hover {
  text-decoration: none;
}
`