import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  
  // Build configuration
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['ethers', 'axios'],
          erc4337: ['@account-abstraction/contracts', '@account-abstraction/sdk', '@account-abstraction/utils'],
          zk: ['@zk-kit/protocols', 'circomlib', 'snarkjs']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/core': resolve(__dirname, './src/core'),
      '@/ui': resolve(__dirname, './src/ui'),
      '@/libs': resolve(__dirname, './src/libs'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },
  
  // CSS configuration
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    },
    devSourcemap: true
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'ethers',
      'axios',
      '@account-abstraction/contracts',
      '@account-abstraction/sdk',
      '@account-abstraction/utils'
    ],
    exclude: [
      '@zk-kit/protocols',
      'circomlib',
      'snarkjs'
    ]
  },
  
  // Preview server
  preview: {
    port: 4173,
    host: true,
    cors: true
  },
  
  // ESBuild configuration
  esbuild: {
    target: 'es2020',
    format: 'esm',
    platform: 'browser'
  }
})
