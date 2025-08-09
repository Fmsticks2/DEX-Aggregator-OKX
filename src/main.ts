import './main.css'
import { WalletManager } from './core/wallet'
import { DEXAggregator } from './core/dex'
import { UIManager } from './ui/manager'
import { NotificationManager } from './ui/notifications'
import { BundleTracker } from './ui/bundle-tracker'
import { ThemeManager } from './ui/theme-manager'

/**
 * Main application entry point
 * Initializes all core services and UI components
 */
class App {
  private walletManager: WalletManager
  private dexAggregator: DEXAggregator
  private uiManager: UIManager
  private notificationManager: NotificationManager
  private bundleTracker: BundleTracker
  private themeManager: ThemeManager

  constructor() {
    // Initialize core services
    this.walletManager = new WalletManager()
    this.dexAggregator = new DEXAggregator(this.walletManager)
    
    // Initialize UI components
    this.notificationManager = new NotificationManager()
    this.bundleTracker = new BundleTracker()
    this.themeManager = new ThemeManager()
    this.uiManager = new UIManager(
      this.walletManager,
      this.dexAggregator,
      this.notificationManager,
      this.bundleTracker
    )
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing FortiFi DEX Aggregator...')
      
      // Initialize theme
      this.themeManager.initialize()
      
      // Initialize wallet manager
      await this.walletManager.initialize()
      
      // Initialize DEX aggregator
      await this.dexAggregator.initialize()
      
      // Initialize UI
      this.uiManager.initialize()
      
      // Initialize bundle tracker
      this.bundleTracker.initialize()
      
      console.log('✅ Application initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize application:', error)
      this.notificationManager.showError('Failed to initialize application')
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App()
  await app.initialize()
})

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})