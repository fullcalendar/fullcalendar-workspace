import { guid } from "./misc"

/*
Values reported through ref callbacks, by key (a measured height per seg, say): `createRef(key)` gives
the same callback for the key each time, a value of null deletes the key (unless ignoreDeletes), and
`rev` changes with every change, so a component can re-render on it
*/
export class RefMap<K, V> {
  public rev: string = ''
  public current = new Map<K, V>()
  private callbacks = new Map<K, (val: V | null) => void>

  constructor(
    public masterCallback?: (val: V, key: K, priorVal: V | null) => void,
    private ignoreDeletes = false
  ) {
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
    let priorExists = current.has(key)
    let priorVal = priorExists ? current.get(key) : null
    let anyChange = false

    // null signals deletion
    if (val === null) {
      if (priorExists && !this.ignoreDeletes) {
        current.delete(key)
        callbacks.delete(key)
        anyChange = true
      }
    } else {
      anyChange = priorVal !== val
      current.set(key, val)
    }

    if (anyChange) {
      this.rev = guid()

      if (this.masterCallback) {
        this.masterCallback(val, key, priorVal)
      }
    }
  }
}
