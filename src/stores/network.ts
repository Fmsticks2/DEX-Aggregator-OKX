import type { Chain } from 'viem'
import { writable } from 'svelte/store'

export type Network = Chain

export const network = writable<Network>()
