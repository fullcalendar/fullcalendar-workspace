import { guid } from "./misc"

/*
TODO: make API where createRefMap() called
*/
export class RefMap<K, V> {
  public rev: string = ''
  public current = new Map<K, V>()
  private callbacks = new Map<K, (val: V | null) => void>
  private _disabled = false

  constructor(
    public masterCallback?: (val: V, key: K) => void,
    private ignoreDeletes = false
  ) {
  }

  /*
  Call in componentWillUnmount to prevent callbacks during child cleanup.
  Parent unmounts fire before children in React, so children reporting null
  would otherwise trigger masterCallback on an unmounting parent.
  */
  disable() {
    this._disabled = true
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
    if (this._disabled) return

    let { current, callbacks } = this

    if (val === null) {
      if (!this.ignoreDeletes) {
        current.delete(key)
        callbacks.delete(key)
      }
    } else {
      current.set(key, val)
    }

    this.rev = guid()

    if (this.masterCallback) {
      this.masterCallback(val, key)
    }
  }
}
