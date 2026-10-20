import { useState } from 'react'
import { useLatest } from './useLatest'

/*
A function with a stable identity that calls the latest committed `fn`. For handlers passed to
memoized children. Only reliable for calls after this component's layout effects, like DOM events.
See planning/hook-toolkit-spec.md §3.4
*/
export function useStableCallback<Args extends any[], Res>(fn: (...args: Args) => Res): (...args: Args) => Res {
  const latestRef = useLatest(fn)
  const [stableFn] = useState(() => (...args: Args) => latestRef.current(...args))
  return stableFn
}
