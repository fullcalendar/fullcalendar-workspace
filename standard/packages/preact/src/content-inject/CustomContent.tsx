import {
  createElement, isValidElement, memo, useContext, useLayoutEffect, useRef,
  type ReactNode, type CSSProperties, type Ref,
} from 'react'
import { ContentGenerator } from '../common/render-hook'
import { useViewContext } from '../hooks/useViewContext'
import { useLatest } from '../hooks/useLatest'
import { useForwardedElRef } from '../hooks/useForwardedElRef'
import { guid } from '../util/misc'
import { isArraysEqual } from '../util/array'
import { isPropsEqualShallow, isPropsEqualWithMap } from '../util/object'
import { isNonHandlerPropsEqual } from '../options-manip'
import { hasCustomRenderingHandler, ElAttrs } from './ContentInjector'
import { RenderId } from './RenderId'
import { ViewOptionsRefined } from '../options'
import { joinClassNames } from '../util/html'

export interface CustomContentProps<RenderProps> {
  tag: string
  className?: string
  style?: CSSProperties & Record<string, any>
  attrs?: ElAttrs
  elRef?: Ref<HTMLElement>
  renderProps: RenderProps
  generatorName: string | undefined // for Vue/Angular, if `generator` is undefined
  generator?: ContentGenerator<RenderProps>
  fallback?: (renderProps: RenderProps) => ReactNode
}

/*
The slot a *Content render hook fills. Owns exactly one element. The function-component replacement
for ContentInjector, with the same results and the same memoization, which keeps *Content call counts
down. See planning/hook-toolkit-spec.md §6.3
*/
function CustomContentImpl<RenderProps>(props: CustomContentProps<RenderProps>) {
  const { options } = useViewContext()
  useContext(RenderId) // re-runs the generator when the vanilla Calendar or a connector bumps it

  // the ref callback must be stable, or React would detach and re-attach it on every commit
  const [elRef, handleEl] = useForwardedElRef(props.elRef)
  const committedElRef = useRef<HTMLElement | null>(null) // as of the last commit, for cleanup
  const idRef = useRef<string>(null)
  idRef.current ??= guid()
  const currentDomNodesRef = useRef<Node[]>([])

  const { generator, fallback, renderProps } = props
  const attrs: ElAttrs = { ...props.attrs, ref: handleEl }
  let useFallback = false
  let innerContent: ReactNode | undefined
  let queuedDomNodes: Node[] = []
  let generatorMeta: any

  if (props.className || attrs.className) {
    attrs.className = joinClassNames(props.className, attrs.className) // in ContentInjector's order
  }
  if (props.style) {
    attrs.style = props.style
  }

  if (generator != null) {
    const res = typeof generator === 'function' ?
      (generator as (renderProps: RenderProps) => any)(renderProps) :
      generator

    if (res === true) {
      useFallback = true
    } else {
      const isObject = res && typeof res === 'object' // non-null

      if (isObject && ('html' in res)) {
        attrs.dangerouslySetInnerHTML = { __html: res.html }
      } else if (isObject && ('domNodes' in res)) {
        queuedDomNodes = Array.prototype.slice.call(res.domNodes)
      } else if (
        isObject
          ? isValidElement(res) // vdom node
          : typeof res !== 'function' // primitive value (like string or number)
      ) {
        innerContent = res as ReactNode
      } else {
        generatorMeta = res // an exotic object for handleCustomRendering (Vue/Angular)
      }
    }
  } else {
    useFallback = !hasCustomRenderingHandler(props.generatorName, options)
  }

  if (useFallback && fallback) {
    innerContent = fallback(renderProps)
  }

  // for the unmount cleanup, which must use the latest committed values, not the first render's
  const latestRef = useLatest({ options, generatorMeta, renderProps, generatorName: props.generatorName })

  // after every commit of this component, like ContentInjector's componentDidMount/DidUpdate
  useLayoutEffect(() => {
    const currentDomNodes = currentDomNodesRef.current

    if (!isArraysEqual(queuedDomNodes, currentDomNodes)) {
      for (const domNode of currentDomNodes) {
        (domNode as Element).remove()
      }
      for (const domNode of queuedDomNodes) {
        elRef.current.appendChild(domNode)
      }
      currentDomNodesRef.current = queuedDomNodes
    }

    committedElRef.current = elRef.current
    triggerCustomRendering(
      options, idRef.current, true, elRef.current, generatorMeta, renderProps, props.generatorName,
    )
  })

  useLayoutEffect(() => () => {
    const latest = latestRef.current
    triggerCustomRendering(
      latest.options, idRef.current, false, committedElRef.current,
      latest.generatorMeta, latest.renderProps, latest.generatorName,
    )
  }, [])

  return createElement(props.tag as any, attrs, innerContent)
}

function triggerCustomRendering<RenderProps>(
  options: ViewOptionsRefined,
  id: string,
  isActive: boolean,
  containerEl: HTMLElement,
  meta: any,
  renderProps: RenderProps,
  generatorName: string | undefined,
) {
  const { handleCustomRendering, customRenderingMetaMap } = options

  if (handleCustomRendering) {
    const resolvedMeta = meta ?? customRenderingMetaMap?.[generatorName]

    if (resolvedMeta) {
      handleCustomRendering({
        id,
        isActive,
        containerEl,
        generatorMeta: resolvedMeta,
        renderProps,
      })
    }
  }
}

const CUSTOM_CONTENT_PROP_EQUALITY = {
  renderProps: isPropsEqualShallow,
  attrs: (attrs0: ElAttrs | undefined, attrs1: ElAttrs | undefined) => (
    attrs0 && attrs1 ? isNonHandlerPropsEqual(attrs0, attrs1) : attrs0 === attrs1 // either can be absent
  ),
  style: isPropsEqualShallow,
}

export const CustomContent = memo(
  CustomContentImpl,
  (prevProps, nextProps) => isPropsEqualWithMap(prevProps, nextProps, CUSTOM_CONTENT_PROP_EQUALITY),
) as unknown as typeof CustomContentImpl // keeps the generic RenderProps parameter
