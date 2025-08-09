export type Listener = (...args: any[]) => void

export class SimpleEventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map()

  on(event: string, listener: Listener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
    return this
  }

  off(event: string, listener: Listener): this {
    const set = this.listeners.get(event)
    if (set) {
      set.delete(listener)
      if (set.size === 0) this.listeners.delete(event)
    }
    return this
  }

  once(event: string, listener: Listener): this {
    const onceListener: Listener = (...args: any[]) => {
      this.off(event, onceListener)
      listener(...args)
    }
    return this.on(event, onceListener)
  }

  emit(event: string, ...args: any[]): boolean {
    const set = this.listeners.get(event)
    if (!set || set.size === 0) return false
    for (const listener of Array.from(set)) {
      try {
        listener(...args)
      } catch (err) {
        // swallow listener errors to avoid breaking emitter
        console.error(`Error in listener for event '${event}':`, err)
      }
    }
    return true
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
    return this
  }
}