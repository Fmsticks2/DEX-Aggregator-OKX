/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Public environment variables (accessible in client-side code)
  readonly PUBLIC_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_ZERO_X_API_KEY: string
  
  // Private environment variables (server-side only, but accessible in dev mode)
  readonly OKX_API_KEY: string
  readonly OKX_API_SECRET: string
  readonly OKX_API_PASSPHRASE: string
  readonly WALLET_CONNECT_VERIFICATION_CODE: string
  
  // Private keys (should be handled securely)
  readonly BUNDLER_PRIVATE_KEY: string
  readonly XLAYER_PRIVATE_KEY: string
  readonly ETHEREUM_PRIVATE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}