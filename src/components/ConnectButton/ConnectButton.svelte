<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { web3modal } from '../../libs/web3/walletConnect'

  let appkitOpen = false
  let unsubscribeAppKit = () => {}

  // Show balance only for desktop or larger screens
  const mediaQuery = window.matchMedia('(min-width: 768px)')
  let balance = mediaQuery.matches ? 'show' : 'hide'

  function onAppKit(state: { open: boolean }) {
    appkitOpen = state.open
  }

  function mediaQueryHandler(event: MediaQueryListEvent) {
    balance = event.matches ? 'show' : 'hide'
  }

  onMount(() => {
    mediaQuery.addEventListener('change', mediaQueryHandler)
    unsubscribeAppKit = web3modal.subscribeState(onAppKit)
  })

  onDestroy(() => {
    mediaQuery.removeEventListener('change', mediaQueryHandler)
    unsubscribeAppKit()
  })
</script>

<appkit-button {balance} />
