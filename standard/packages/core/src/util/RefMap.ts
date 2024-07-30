export class RefMap<K, V> {
  public current = new Map<K, V>()
  private callbacks = new Map<K, (val: V | null) => void>

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
    let { current, callbacks } = this

    if (val === null) {
      current.delete(key)
      callbacks.delete(key)
    } else {
      current.set(key, val)
    }

    if (this.masterCallback) {
      this.masterCallback(val, key)
    }
  }
}
