import { type Ref, type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { setRef } from '../vdom-util'

/*
A stable ref callback for an element, which also hands the element to `forwardRef`. When
`forwardRef` changes, the old one is released (given null) and the new one gets the element.
Returns the element's ref object too
*/
export function useForwardedElRef(
  forwardRef: Ref<HTMLElement> | undefined,
): [RefObject<HTMLElement | null>, (el: HTMLElement | null) => void] {
  const elRef = useRef<HTMLElement | null>(null)
  const forwardedToRef = useRef<Ref<HTMLElement> | undefined>(undefined) // the ref holding the element

  // assigned during render, because the ref callback runs during the commit, before layout effects
  const forwardRefRef = useRef(forwardRef)
  forwardRefRef.current = forwardRef

  const [handleEl] = useState(() => (el: HTMLElement | null) => {
    elRef.current = el
    setRef(forwardedToRef.current, null)
    forwardedToRef.current = el ? forwardRefRef.current : undefined
    setRef(forwardedToRef.current, el)
  })

  // a new forwardRef for the same element, which doesn't call the ref callback again
  useLayoutEffect(() => {
    if (elRef.current && forwardedToRef.current !== forwardRef) {
      setRef(forwardedToRef.current, null)
      forwardedToRef.current = forwardRef
      setRef(forwardRef, elRef.current)
    }
  })

  return [elRef, handleEl]
}
