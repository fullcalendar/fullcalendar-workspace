import { isArraysEqual } from '../util/array'

/*
A memoize per key. For each key, `argsFor(key)` is compared to the key's stored args element-wise
by identity (as memoize does); the stale keys are computed together, in one call, and the rest
return their stored results. Keys no longer asked for are evicted, so a key that returns later is
recomputed even with equal args
*/
export interface KeyedCache<Args extends any[], Res> {
  get(
    keys: string[],
    argsFor: (key: string) => Args,
    compute: (staleKeys: string[]) => { [key: string]: Res },
  ): { [key: string]: Res }
}

interface KeyedCacheEntry<Args, Res> {
  args: Args
  res: Res
}

export function createKeyedCache<Args extends any[], Res>(): KeyedCache<Args, Res> {
  let entries: { [key: string]: KeyedCacheEntry<Args, Res> } = {}

  return {
    get(keys, argsFor, compute) {
      let nextEntries: { [key: string]: KeyedCacheEntry<Args, Res> } = {}
      let staleKeys: string[] = []
      let staleArgs: Args[] = []

      for (let key of keys) {
        let args = argsFor(key)
        let entry = entries[key]

        if (entry && isArraysEqual(entry.args, args)) {
          nextEntries[key] = entry
        } else {
          staleKeys.push(key)
          staleArgs.push(args)
        }
      }

      if (staleKeys.length) {
        let computed = compute(staleKeys)

        for (let i = 0; i < staleKeys.length; i += 1) {
          nextEntries[staleKeys[i]] = { args: staleArgs[i], res: computed[staleKeys[i]] }
        }
      }

      entries = nextEntries

      let results: { [key: string]: Res } = {}

      for (let key of keys) {
        results[key] = nextEntries[key].res
      }

      return results
    },
  }
}
