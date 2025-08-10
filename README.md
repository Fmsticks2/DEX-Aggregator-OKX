# FortiFi - MEV-Resistant DEX Aggregator

<p align="center">
  <img width="240" src="static/fortifi-logo.svg" alt="FortiFi DEX Aggregator">
</p>

A sophisticated decentralized exchange aggregator that provides MEV-resistant trading across multiple DEX protocols. FortiFi aggregates liquidity from OKX DEX and 0x protocols to find the best possible prices while protecting users from MEV attacks.

**🚀 Live Demo:** [https://fortifi-dex.vercel.app](https://fortifi-dex.vercel.app)

<p align="center">
  <img width="600" src="resources/dex-screen.png" alt="FortiFi Interface">
</p>

## Features

### 🛡️ MEV Protection
- **Account Abstraction (ERC-4337)** for bundle-based transactions
- **ZK-SNARK privacy** to hide transaction details until execution
- **Smart bundling** to prevent front-running and sandwich attacks

### 🔄 Multi-Protocol Aggregation
- **OKX DEX API** - Primary liquidity aggregation
- **0x Protocol** - Additional liquidity sources
- **Best price discovery** across all integrated protocols
- **Route optimization** for minimal slippage

### 🌐 Multi-Chain Support
- Ethereum Mainnet
- Polygon
- Binance Smart Chain
- Arbitrum
- Optimism
- Base

### 🎨 Modern UI/UX
- Dark and light theme support
- Responsive design for all screen sizes
- Over 4,000 ERC20 tokens supported
- One-click token addition to wallet
- Real-time price updates and quotes

## API Integrations

### OKX DEX API ✅ Confirmed
- **Base URL:** `https://www.okx.com/api/v5/dex/aggregator`
- **Quote Endpoint:** `/quote` - Get best price quotes
- **Swap Endpoint:** `/swap` - Get transaction data for execution
- **Features:** Multi-protocol routing, gas estimation, slippage protection

### 0x Protocol
- **Base URL:** `https://api.0x.org`
- **Quote/Swap Endpoints:** Integrated for additional liquidity
- **API Key:** Required for production usage

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# OKX DEX API Credentials (get from OKX API dashboard)
OKX_API_KEY=your_okx_api_key_here
OKX_API_SECRET=your_okx_api_secret_here
OKX_API_PASSPHRASE=your_okx_passphrase_here

# WalletConnect Domain Verification
WALLET_CONNECT_VERIFICATION_CODE=your_verification_code_here

# 0x Protocol API Key (optional, for enhanced features)
VITE_ZERO_X_API_KEY=your_0x_api_key_here

# Private Keys (Keep these secure and never commit to version control)
# XLayer Private Key - Used for XLayer network operations
XLAYER_PRIVATE_KEY=your_xlayer_private_key_here

# Ethereum Private Key - Used for Ethereum network operations
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key_here

# Bundler Private Key - Used for ERC-4337 smart account operations
BUNDLER_PRIVATE_KEY=your_bundler_private_key_here
```

### Getting API Keys

1. **WalletConnect Project ID:**
   - Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID

2. **OKX API Credentials:**
   - Sign up at [OKX](https://www.okx.com/)
   - Navigate to API Management
   - Create a new API key with read permissions
   - Save the API Key, Secret, and Passphrase

3. **0x API Key (Optional):**
   - Visit [0x Dashboard](https://0x.org/docs/api)
   - Sign up for an API key
   - Add to environment for enhanced rate limits

## Development

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Building
```bash
# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel Deployment

1. **Fork/Clone** this repository
2. **Connect** your GitHub repo to Vercel
3. **Add Environment Variables** in Vercel dashboard:
   - `PUBLIC_WALLET_CONNECT_PROJECT_ID`
   - `OKX_API_KEY`
   - `OKX_API_SECRET` 
   - `OKX_API_PASSPHRASE`
   - `WALLET_CONNECT_VERIFICATION_CODE`
   - `VITE_ZERO_X_API_KEY` (optional)

4. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment
```bash
# Build the project
npm run build

# Deploy dist/ folder to your hosting provider
```

## Technical Architecture

### MEV Protection Stack
- **ERC-4337 Account Abstraction** for transaction bundling
- **ZK-SNARK Proofs** using Circom for privacy
- **Private Mempool** submission via bundlers
- **Intent-based Architecture** for delayed execution

### Smart Contract Integration
- **EntryPoint Contract** (v0.6): `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
- **Account Factory**: Dynamic smart account deployment
- **Paymaster Support**: Gasless transactions capability

### Technology Stack
- **Frontend:** Vanilla TypeScript + Vite
- **Styling:** Tailwind CSS + DaisyUI
- **Blockchain:** Ethers.js v6
- **APIs:** OKX DEX, 0x Protocol
- **Privacy:** ZK-Kit, Circom, SnarkJS

## Security Considerations

- All private keys are generated client-side only
- Environment variables are properly scoped (VITE_ prefix for public)
- API keys are securely stored on server-side only
- ZK proofs provide transaction privacy until execution
- Smart account architecture prevents direct wallet exposure

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**FortiFi** - Protecting DeFi users from MEV while providing the best possible trading experience.
