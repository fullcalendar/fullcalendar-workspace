import { type Ref, useRef, useState } from 'react'
import {
  ClassNameGenerator, DidMountHandler, WillUnmountHandler, generateClassName,
} from '../common/render-hook'
import { setRef } from '../vdom-util'
import { useMountHooks } from './useMountHooks'

export interface RenderHookElInput<RenderProps> {
  classGenerator: ClassNameGenerator<RenderProps> | undefined
  didMount: DidMountHandler<RenderProps> | undefined
  willUnmount: WillUnmountHandler<RenderProps> | undefined
  renderProps: RenderProps
  elRef?: Ref<HTMLElement> // also given the element
}

export interface RenderHookEl {
  className: string
  ref: (el: HTMLElement | null) => void // stable
}

/*
The outer element of a render-hook area: its *Class className, and a ref that runs its
*DidMount/*WillUnmount. Spread onto whatever element the caller renders. The ref also suits
<CustomContent>'s elRef, when the area's element is the content slot.
See planning/hook-toolkit-spec.md §6.4
*/
export function useRenderHookEl<RenderProps>(input: RenderHookElInput<RenderProps>): RenderHookEl {
  const elRef = useRef<HTMLElement | null>(null)

  // assigned during render, because the ref callback runs during the commit, before layout effects
  const elRefPropRef = useRef(input.elRef)
  elRefPropRef.current = input.elRef

  const [ref] = useState(() => (el: HTMLElement | null) => {
    elRef.current = el
    setRef(elRefPropRef.current, el)
  })

  useMountHooks(elRef, input.didMount, input.willUnmount, input.renderProps)

  return {
    className: generateClassName(input.classGenerator, input.renderProps),
    ref,
  }
}
