/**
 * Environment Variable Utilities
 * Secure access to environment variables with validation
 */

/**
 * Get private key from environment variables with validation
 */
export function getPrivateKey(keyName: 'BUNDLER_PRIVATE_KEY' | 'XLAYER_PRIVATE_KEY' | 'ETHEREUM_PRIVATE_KEY'): string {
  const privateKey = import.meta.env[keyName]
  
  if (!privateKey) {
    throw new Error(`${keyName} environment variable is required but not found`)
  }
  
  // Validate private key format (should be 64 hex characters with optional 0x prefix)
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey
  
  if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
    throw new Error(`${keyName} must be a valid 64-character hexadecimal private key`)
  }
  
  return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
}

/**
 * Get API credentials from environment variables
 */
export function getOKXCredentials() {
  const apiKey = import.meta.env.OKX_API_KEY
  const apiSecret = import.meta.env.OKX_API_SECRET
  const passphrase = import.meta.env.OKX_API_PASSPHRASE
  
  if (!apiKey || !apiSecret || !passphrase) {
    throw new Error('OKX API credentials (OKX_API_KEY, OKX_API_SECRET, OKX_API_PASSPHRASE) are required')
  }
  
  return { apiKey, apiSecret, passphrase }
}

/**
 * Get WalletConnect project ID
 */
export function getWalletConnectProjectId(): string {
  const projectId = import.meta.env.PUBLIC_WALLET_CONNECT_PROJECT_ID
  
  if (!projectId) {
    throw new Error('PUBLIC_WALLET_CONNECT_PROJECT_ID environment variable is required')
  }
  
  return projectId
}

/**
 * Check if all required environment variables are present
 */
export function validateEnvironmentVariables(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'BUNDLER_PRIVATE_KEY',
    'XLAYER_PRIVATE_KEY', 
    'ETHEREUM_PRIVATE_KEY',
    'OKX_API_KEY',
    'OKX_API_SECRET',
    'OKX_API_PASSPHRASE',
    'PUBLIC_WALLET_CONNECT_PROJECT_ID'
  ]
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName])
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  }
}