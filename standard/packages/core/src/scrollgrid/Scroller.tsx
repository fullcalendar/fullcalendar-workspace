import { isDimsEqual } from '../component-util/rendering-misc.js'
import { watchSize } from '../component-util/resize-observer.js'
import { DateComponent, Dictionary, removeElement, setRef } from '../internal.js'
import { ComponentChildren, createElement, createRef, Ref } from '../preact.js'
import { ScrollerInterface } from './ScrollerInterface.js'

export interface ScrollerProps {
  vertical?: boolean // true always implies 'auto' (won't show scrollbars if no overflow)
  horizontal?: boolean // (same)
  hideScrollbars?: boolean // default: false
  children: ComponentChildren

  // el hooks
  elClassNames?: string[]
  elStyle?: Dictionary

  // dimensions
  widthRef?: Ref<number>
  heightRef?: Ref<number>
  leftScrollbarWidthRef?: Ref<number>
  rightScrollbarWidthRef?: Ref<number>
  bottomScrollbarWidthRef?: Ref<number>
}

export class Scroller extends DateComponent<ScrollerProps> implements ScrollerInterface {
  // ref
  private elRef = createRef<HTMLDivElement>()

  // internal
  private disconnectSize?: () => void
  private currentWidth: number
  private currentHeight: number
  private currentLeftScrollbarWidth: number
  private currentRightScrollbarWidth: number
  private currentBottomScrollbarWidth: number

  render() {
    const { props } = this

    return (
      <div
        ref={this.elRef}
        className={[
          'fcnew-scroller',
          props.hideScrollbars ? 'fcnew-scroller-nobars' : '',
          ...(props.elClassNames || []),
        ].join(' ')}
        style={{
          ...props.elStyle,
          overflowX: props.horizontal ? 'auto' : 'hidden',
          overflowY: props.vertical ? 'auto' : 'hidden',
        }}
      >{props.children}</div>
    )
  }

  componentDidMount(): void {
    const el = this.elRef.current // TODO: make dynamic with useEffect

    this.disconnectSize = watchSize(el, (contentWidth, contentHeight) => {
      const { props, context } = this
      const bottomScrollbarWidth = el.offsetHeight - el.clientHeight
      const horizontalScrollbarWidth = el.offsetWidth - el.clientWidth
      let rightScrollbarWidth = 0
      let leftScrollbarWidth = 0

      if (context.isRtl && getRtlScrollerConfig().leftScrollbars) {
        leftScrollbarWidth = horizontalScrollbarWidth
      } else {
        rightScrollbarWidth = horizontalScrollbarWidth
      }

      if (!isDimsEqual(this.currentWidth, contentWidth)) {
        setRef(props.widthRef, this.currentWidth = contentWidth)
      }
      if (!isDimsEqual(this.currentHeight, contentHeight)) {
        setRef(props.heightRef, this.currentHeight = contentHeight)
      }
      if (!isDimsEqual(this.currentBottomScrollbarWidth, bottomScrollbarWidth)) {
        setRef(props.bottomScrollbarWidthRef, this.currentBottomScrollbarWidth = bottomScrollbarWidth)
      }
      if (!isDimsEqual(this.currentRightScrollbarWidth, rightScrollbarWidth)) {
        setRef(props.rightScrollbarWidthRef, this.currentRightScrollbarWidth = rightScrollbarWidth)
      }
      if (!isDimsEqual(this.currentLeftScrollbarWidth, leftScrollbarWidth)) {
        setRef(props.leftScrollbarWidthRef, this.currentLeftScrollbarWidth = leftScrollbarWidth)
      }
    })
  }

  componentWillUnmount(): void {
    this.disconnectSize()
  }

  // Public API
  // -----------------------------------------------------------------------------------------------

  get el(): HTMLElement {
    return this.elRef.current
  }

  get x(): number {
    const { isRtl } = this.context
    const el = this.elRef.current
    return getNormalizedScrollX(el, isRtl)
  }

  get y(): number {
    const el = this.elRef.current
    return el.scrollTop
  }

  scrollTo({ x, y }: { x?: number, y?: number }): void {
    const { isRtl } = this.context
    const el = this.elRef.current

    if (y != null) {
      el.scrollTop = y
    }

    if (x != null) {
      setNormalizedScrollX(el, isRtl, x)
    }
  }
}

// Public API
// -------------------------------------------------------------------------------------------------
// TODO: consolidate with scroll-left-norm.ts

export function getNormalizedScrollX(el: HTMLElement, isRtl: boolean): number {
  const { scrollLeft } = el
  return isRtl ? getNormalizedRtlScrollX(scrollLeft, el) : scrollLeft
}

export function setNormalizedScrollX(el: HTMLElement, isRtl: boolean, x: number): void {
  el.scrollLeft = isRtl ? getNormalizedRtlScrollLeft(x, el) : x
}

/*
Returns a value in the 'reverse' system
*/
function getNormalizedRtlScrollX(scrollLeft: number, el: HTMLElement): number {
  switch (getRtlScrollerConfig().system) {
    case 'positive':
      return el.scrollWidth - el.clientWidth - scrollLeft
    case 'negative':
      return -scrollLeft
  }
  return scrollLeft
}

/*
Receives a value in the 'reverse' system
TODO: is this really the same equations as getNormalizedRtlScrollX??? I think so
  If so, consolidate. With isRtl check too
*/
function getNormalizedRtlScrollLeft(x: number, el: HTMLElement): number {
  switch (getRtlScrollerConfig().system) {
    case 'positive':
      return el.scrollWidth - el.clientWidth - x
    case 'negative':
      return -x
  }
  return x
}

// Detection
// -------------------------------------------------------------------------------------------------
// TODO: consolidate with scroll-left-norm.ts

type RtlScrollerSystem = 'positive' | 'negative' | 'reverse'

interface RtlScrollerConfig {
  system: RtlScrollerSystem
  leftScrollbars: boolean
}

let _rtlScrollerConfig: RtlScrollerConfig | undefined

function getRtlScrollerConfig(): RtlScrollerConfig {
  return _rtlScrollerConfig || (_rtlScrollerConfig = detectRtlScrollerConfig())
}

function detectRtlScrollerConfig(): RtlScrollerConfig {
  let el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.top = '-1000px'
  el.style.width = '100px' // must be at least the side of scrollbars or you get inaccurate values (#7335)
  el.style.height = '100px' // "
  el.style.overflow = 'scroll'
  el.style.direction = 'rtl'

  let innerEl = document.createElement('div')
  innerEl.style.width = '200px'
  innerEl.style.height = '200px'

  el.appendChild(innerEl)
  document.body.appendChild(el)

  let system: RtlScrollerSystem
  if (el.scrollLeft > 0) {
    system = 'positive' // scroll is a positive number from the left edge
  } else {
    el.scrollLeft = 50
    if (el.scrollLeft > 0) {
      system = 'reverse' // scroll is a positive number from the right edge
    } else {
      system = 'negative' // scroll is a negative number from the right edge
    }
  }

  let leftScrollbars = innerEl.getBoundingClientRect().left > el.getBoundingClientRect().left

  removeElement(el)

  return { system, leftScrollbars }
}
