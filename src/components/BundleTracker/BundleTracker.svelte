<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { account } from '../../stores/account'
  import type { BundleIntent } from '../../libs/api/types'
  import { getBundler } from '../../libs/erc4337/bundler'
  import { _ } from 'svelte-i18n'

  let pendingIntents: BundleIntent[] = []
  let estimatedSavings = '0'
  let bundleProgress = 0
  let nextBundleTime = 0
  let refreshInterval: NodeJS.Timeout

  const BUNDLE_SIZE = 5
  const BUNDLE_TIMEOUT = 10000 // 10 seconds

  onMount(() => {
    loadBundleData()
    refreshInterval = setInterval(loadBundleData, 1000)
  })

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })

  async function loadBundleData() {
    try {
      const bundler = getBundler()
      if (!bundler || !$account?.address) {
        return
      }

      // Get pending intents
      pendingIntents = bundler.getPendingIntents()

      // Calculate bundle progress
      bundleProgress = Math.min((pendingIntents.length / BUNDLE_SIZE) * 100, 100)

      // Calculate estimated savings
      await calculateEstimatedSavings(bundler)

      // Calculate next bundle time
      calculateNextBundleTime()
    } catch (error) {
      console.error('Failed to load bundle data:', error)
    }
  }

  async function calculateEstimatedSavings(bundler: any) {
    if (pendingIntents.length === 0) {
      estimatedSavings = '0'
      return
    }

    try {
      const savings = await Promise.all(
        pendingIntents.map(intent => bundler.calculateMEVSavings(intent))
      )
      
      const totalSavings = savings.reduce((sum, saving) => sum + parseFloat(saving), 0)
      estimatedSavings = totalSavings.toFixed(4)
    } catch (error) {
      console.error('Failed to calculate savings:', error)
      estimatedSavings = '0'
    }
  }

  function calculateNextBundleTime() {
    if (pendingIntents.length === 0) {
      nextBundleTime = 0
      return
    }

    const oldestIntent = pendingIntents.reduce((oldest, intent) => 
      intent.timestamp < oldest.timestamp ? intent : oldest
    )

    const timeElapsed = Date.now() - oldestIntent.timestamp
    const timeRemaining = Math.max(0, BUNDLE_TIMEOUT - timeElapsed)
    nextBundleTime = Math.ceil(timeRemaining / 1000)
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString()
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning'
      case 'bundled': return 'success'
      case 'failed': return 'error'
      default: return 'neutral'
    }
  }

  function getProgressColor(): string {
    if (bundleProgress >= 100) return 'success'
    if (bundleProgress >= 60) return 'warning'
    return 'primary'
  }
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
      </svg>
      Live Bundle Tracking
    </h2>

    <!-- Bundle Progress -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium">Bundle Progress</span>
        <span class="text-sm text-base-content/60">
          {pendingIntents.length}/{BUNDLE_SIZE} intents
        </span>
      </div>
      
      <div class="w-full bg-base-200 rounded-full h-2.5">
        <div 
          class="bg-{getProgressColor()} h-2.5 rounded-full transition-all duration-300"
          style="width: {bundleProgress}%"
        ></div>
      </div>
      
      {#if nextBundleTime > 0}
        <div class="text-xs text-base-content/60 mt-1">
          Next bundle in: {nextBundleTime}s
        </div>
      {/if}
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="stat bg-base-200 rounded-lg p-3">
        <div class="stat-title text-xs">Estimated Savings</div>
        <div class="stat-value text-lg text-success">${estimatedSavings}</div>
        <div class="stat-desc text-xs">From MEV protection</div>
      </div>
      
      <div class="stat bg-base-200 rounded-lg p-3">
        <div class="stat-title text-xs">Pending Intents</div>
        <div class="stat-value text-lg">{pendingIntents.length}</div>
        <div class="stat-desc text-xs">Awaiting bundle</div>
      </div>
    </div>

    <!-- Pending Intents List -->
    {#if pendingIntents.length === 0}
      <div class="text-center py-6 text-base-content/60">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <div class="text-sm">No pending swap intents</div>
        <div class="text-xs">Start a swap to see bundle tracking</div>
      </div>
    {:else}
      <div class="space-y-2 max-h-64 overflow-y-auto">
        {#each pendingIntents as intent}
          <div class="border border-base-300 rounded-lg p-3 bg-base-50">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-sm">
                    {intent.swapData.amount} → {intent.swapData.expectedOutput}
                  </span>
                  <div class="badge badge-{getStatusColor(intent.status)} badge-xs">
                    {intent.status}
                  </div>
                </div>
                
                <div class="text-xs text-base-content/60 mb-1">
                  {intent.swapData.fromToken.slice(0, 6)}...{intent.swapData.fromToken.slice(-4)} → 
                  {intent.swapData.toToken.slice(0, 6)}...{intent.swapData.toToken.slice(-4)}
                </div>
                
                <div class="text-xs text-base-content/50">
                  Created: {formatTime(intent.timestamp)}
                </div>
              </div>
              
              <div class="text-right">
                <div class="text-xs text-base-content/60">
                  ID: {intent.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Bundle Info -->
    <div class="mt-4 p-3 bg-info/10 rounded-lg">
      <div class="flex items-start gap-2">
        <svg class="w-4 h-4 text-info mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="text-xs text-info">
          <div class="font-medium mb-1">How Bundle Tracking Works</div>
          <div>
            Swaps are collected into bundles of up to {BUNDLE_SIZE} transactions or bundled after {BUNDLE_TIMEOUT/1000} seconds. 
            ZK-proofs ensure fair ordering and MEV protection.
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .stat {
    @apply min-h-0;
  }
  
  .stat-title {
    @apply opacity-60;
  }
  
  .stat-value {
    @apply font-bold;
  }
  
  .stat-desc {
    @apply opacity-60;
  }
</style>