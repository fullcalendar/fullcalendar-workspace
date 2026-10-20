import { type RefObject, useLayoutEffect, useRef } from 'react'

/*
A ref holding the value from the latest committed render. Updated in a layout effect, not during
render, so a render that never commits doesn't leak into callbacks. Only reliable for callbacks that
run after this component's layout effects. See planning/hook-toolkit-spec.md §3.4
*/
export function useLatest<Value>(value: Value): RefObject<Value> {
  const ref = useRef(value)

  useLayoutEffect(() => {
    ref.current = value
  })

  return ref
}
