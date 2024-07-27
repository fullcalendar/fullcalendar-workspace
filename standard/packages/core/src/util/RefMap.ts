export class RefMap<K, V> {
  public current = new Map<K, V>()
  private callbacks = new Map<K, (val: V | null) => void>
  private depths = new Map<K, number>() // TODO: still need this for repeat firing?

  constructor(public masterCallback?: (val: V, key: K) => void) {
  }

  createRef(key: K) {
    let refCallback = this.callbacks.get(key)

    if (!refCallback) {
      refCallback = (val: V) => {
        this.handleValue(val, key)
      }
      this.callbacks.set(key, refCallback)
    }

    return refCallback
  }

  handleValue = (val: V, key: K) => { // bind in case users want to pass it around
    let { current, callbacks, depths } = this
    let removed = false
    let added = false
    let depth = depths.get(key) || 0

    if (val !== null) {
      // first remove before adding?
      // for bug... ACTUALLY: can probably do away with this now that callers don't share numeric indices anymore
      removed = current.has(key)

      current.set(key, val)
      depths.set(key, ++depth)
      added = true
    } else {
      depths.set(key, --depth)

      if (!depth) {
        current.delete(key)
        callbacks.delete(key)
        removed = true
      }
    }

    if (this.masterCallback) {
      if (removed) {
        this.masterCallback(null, key)
      }
      if (added) {
        this.masterCallback(val, key)
      }
    }
  }
}
