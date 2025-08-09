<script lang="ts">
  import { onMount } from 'svelte'
  import { account } from '../../stores/account'
  import { network } from '../../stores/network'
  import type { MEVComparison, BundleIntent } from '../../libs/api/types'
  import { getBundler } from '../../libs/erc4337/bundler'
  import { calculateMEVProtectionScore } from '../../libs/erc4337/zkProofs'
  import { _ } from 'svelte-i18n'

  export let visible = false

  let mevComparisons: MEVComparison[] = []
  let totalSavings = '0'
  let protectionScore = 0
  let pendingIntents: BundleIntent[] = []
  let loading = true

  onMount(() => {
    loadMEVData()
    // Refresh data every 10 seconds
    const interval = setInterval(loadMEVData, 10000)
    return () => clearInterval(interval)
  })

  async function loadMEVData() {
    try {
      const bundler = getBundler()
      if (!bundler || !$account?.address) {
        loading = false
        return
      }

      // Get pending intents
      pendingIntents = bundler.getPendingIntents()

      // Load MEV comparisons
      await loadMEVComparisons()

      // Calculate total savings
      calculateTotalSavings()

      // Calculate protection score
      calculateProtectionScore()

      loading = false
    } catch (error) {
      console.error('Failed to load MEV data:', error)
      loading = false
    }
  }

  async function loadMEVComparisons() {
    // Simulate MEV comparison data
    // In production, this would fetch real data from multiple DEXs
    mevComparisons = [
      {
        ourRate: '1850.45',
        uniswapRate: '1847.82',
        oneInchRate: '1848.91',
        savings: '2.34',
        savingsPercentage: '0.13'
      }
    ]
  }

  function calculateTotalSavings() {
    const savings = mevComparisons
      .reduce((total, comp) => total + parseFloat(comp.savings), 0)
    totalSavings = savings.toFixed(2)
  }

  function calculateProtectionScore() {
    if (pendingIntents.length === 0) {
      protectionScore = 0
      return
    }

    // Calculate average protection score from pending intents
    const scores = pendingIntents.map(intent => {
      // Mock fair ordering proof for demo
      const mockProof = {
        zkProof: {
          proof: {
            pi_a: ['0', '0', '0'] as [string, string, string],
            pi_b: [['0', '0'], ['0', '0'], ['0', '0']] as [[string, string], [string, string], [string, string]],
            pi_c: ['0', '0', '0'] as [string, string, string]
          },
          publicSignals: ['timestamp', 'hash']
        },
        commitment: 'mock_commitment',
        nullifier: 'mock_nullifier',
        timestamp: intent.timestamp,
        isValid: true
      }
      return calculateMEVProtectionScore(mockProof)
    })

    protectionScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  function getBestRate(): MEVComparison | null {
    if (mevComparisons.length === 0) return null
    return mevComparisons.reduce((best, current) => 
      parseFloat(current.ourRate) > parseFloat(best.ourRate) ? current : best
    )
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString()
  }
</script>

{#if visible}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-base-100 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">MEV Protection Dashboard</h2>
        <button 
          class="btn btn-ghost btn-sm" 
          on:click={() => visible = false}
        >
          ✕
        </button>
      </div>

      {#if loading}
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else}
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Total MEV Savings</div>
            <div class="stat-value text-success">${totalSavings}</div>
            <div class="stat-desc">Protected swaps only</div>
          </div>
          
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Protection Score</div>
            <div class="stat-value text-primary">{protectionScore.toFixed(0)}%</div>
            <div class="stat-desc">ZK-proof quality</div>
          </div>
          
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Pending Intents</div>
            <div class="stat-value">{pendingIntents.length}</div>
            <div class="stat-desc">Awaiting bundle</div>
          </div>
        </div>

        <!-- Rate Comparison Table -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Rate Comparison</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>DEX</th>
                  <th>Rate (USDC)</th>
                  <th>MEV Savings</th>
                  <th>Protection</th>
                </tr>
              </thead>
              <tbody>
                {#each mevComparisons as comparison}
                  <tr>
                    <td>
                      <div class="flex items-center gap-2">
                        OKX DEX (Protected)
                        <div class="badge badge-success badge-sm">Protected</div>
                      </div>
                    </td>
                    <td class="font-mono">{comparison.ourRate}</td>
                    <td class="font-mono text-success">
                      +${comparison.savings}
                    </td>
                    <td>
                      <div class="badge badge-success">✓ ZK-Proof</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div class="flex items-center gap-2">
                        Uniswap V3
                      </div>
                    </td>
                    <td class="font-mono">{comparison.uniswapRate}</td>
                    <td class="font-mono text-error">
                      $0.00
                    </td>
                    <td>
                      <div class="badge badge-error">✗ Vulnerable</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div class="flex items-center gap-2">
                        1inch
                      </div>
                    </td>
                    <td class="font-mono">{comparison.oneInchRate}</td>
                    <td class="font-mono text-error">
                      $0.00
                    </td>
                    <td>
                      <div class="badge badge-error">✗ Vulnerable</div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Live Bundle Tracking -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Live Bundle Tracking</h3>
          {#if pendingIntents.length === 0}
            <div class="text-center py-8 text-base-content/60">
              No pending swap intents
            </div>
          {:else}
            <div class="space-y-3">
              {#each pendingIntents as intent}
                <div class="card bg-base-200 p-4">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-semibold">
                        {intent.swapData.amount} → {intent.swapData.expectedOutput}
                      </div>
                      <div class="text-sm text-base-content/60">
                        {intent.swapData.fromToken} → {intent.swapData.toToken}
                      </div>
                      <div class="text-xs text-base-content/50">
                        Created: {formatTime(intent.timestamp)}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="badge badge-{intent.status === 'pending' ? 'warning' : intent.status === 'bundled' ? 'success' : 'error'}">
                        {intent.status}
                      </div>
                      <div class="text-xs text-base-content/60 mt-1">
                        ID: {intent.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- MEV Protection Explanation -->
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h4 class="font-bold">How MEV Protection Works</h4>
            <div class="text-sm">
              Our smart account bundler uses zk-proofs to ensure fair ordering of swaps, 
              preventing MEV bots from front-running your transactions. Swaps are bundled 
              together and executed in a provably fair order, saving you money on gas and slippage.
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="postcss">
  .stat {
    @apply p-4;
  }
  
  .stat-title {
    @apply text-sm opacity-60;
  }
  
  .stat-value {
    @apply text-2xl font-bold;
  }
  
  .stat-desc {
    @apply text-xs opacity-60;
  }
</style>