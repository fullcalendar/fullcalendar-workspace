import { isDimsEqual } from '../component-util/rendering-misc.js'
import { watchSize } from '../component-util/resize-observer.js'
import { DateComponent } from '../component/DateComponent.js'
import { removeElement } from '../util/dom-manip.js'
import { joinClassNames } from '../util/html.js'
import { setRef } from '../vdom-util.js'
import { Dictionary } from '../options.js'
import { ComponentChildren, createElement, createRef, Ref } from '../preact.js'
import { ScrollerInterface } from './ScrollerInterface.js'
import { ScrollListener } from './ScrollListener.js'

export interface ScrollerProps {
  vertical?: boolean // true always implies 'auto' (won't show scrollbars if no overflow)
  horizontal?: boolean // (same)
  hideScrollbars?: boolean // default: false
  children: ComponentChildren

  // el hooks
  className?: string
  style?: Dictionary

  // dimensions
  clientWidthRef?: Ref<number> // for this to be accurate, element should NOT have left/right borders
  clientHeightRef?: Ref<number> // for this to be accurate, element should NOT have top/bottom borders
  leftScrollbarWidthRef?: Ref<number>
  rightScrollbarWidthRef?: Ref<number>
  bottomScrollbarWidthRef?: Ref<number>
}

export class Scroller extends DateComponent<ScrollerProps> implements ScrollerInterface {
  // ref
  private elRef = createRef<HTMLDivElement>()

  // internal
  public listener: ScrollListener // public for ScrollerSyncer
  private disconnectSize?: () => void
  private currentClientWidth: number
  private currentClientHeight: number
  private currentLeftScrollbarWidth: number
  private currentRightScrollbarWidth: number
  private currentBottomScrollbarWidth: number

  render() {
    const { props } = this

    // if there's only one axis that needs scrolling, the other axis will unintentionally have
    // scrollbars too, so we must force to 'hidden'
    const fallbackOverflow = (props.horizontal || props.vertical) ? 'hidden' : ''

    return (
      <div
        ref={this.elRef}
        className={joinClassNames(
          props.className,
          'fc-scroller',
          props.hideScrollbars && 'fc-scroller-nobars',
        )}
        style={{
          ...props.style,
          overflowX: props.horizontal ? 'auto' : fallbackOverflow,
          overflowY: props.vertical ? 'auto' : fallbackOverflow,
        }}
      >{props.children}</div>
    )
  }

  componentDidMount(): void {
    const el = this.elRef.current // TODO: make dynamic with useEffect

    this.listener = new ScrollListener(el)

    this.disconnectSize = watchSize(el, (clientWidth, clientHeight) => {
      const { props, context } = this
      const bottomScrollbarWidth = el.offsetHeight - clientHeight
      const horizontalScrollbarWidth = el.offsetWidth - clientWidth

      let rightScrollbarWidth = 0
      let leftScrollbarWidth = 0

      /*
      TODO: more clever way to detect RTL behavior based on current scroller's inner center of mass
      Only do it if horizontalScrollbarWidth as well as if leftScrollbarWidthRef/rightScrollbarWidthRef,
      meaning caller is compliant about avoiding left/right borders.
      However, might not be worth it because still need to query RtlScrollerSystem
      */
      if (context.isRtl && getRtlScrollerConfig().leftScrollbars) {
        leftScrollbarWidth = horizontalScrollbarWidth
      } else {
        rightScrollbarWidth = horizontalScrollbarWidth
      }

      if (this.currentClientWidth !== clientWidth) {
        setRef(props.clientWidthRef, this.currentClientWidth = clientWidth)
      }
      if (this.currentClientHeight !== clientHeight) {
        setRef(props.clientHeightRef, this.currentClientHeight = clientHeight)
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
    }, /* client(width+height) = */ true)
  }

  componentWillUnmount(): void {
    const { props } = this

    this.disconnectSize()
    this.listener.destroy()

    setRef(props.clientWidthRef, null)
    setRef(props.clientHeightRef, null)
    setRef(props.bottomScrollbarWidthRef, null)
    setRef(props.rightScrollbarWidthRef, null)
    setRef(props.leftScrollbarWidthRef, null)
  }

  endScroll() {
    this.listener.endScroll()
  }

  // Public API
  // -----------------------------------------------------------------------------------------------

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

  addScrollEndListener(handler: (x: number, y: number) => void): void {
    this.listener.emitter.on('scrollEnd', handler)
  }

  removeScrollEndListener(handler: (x: number, y: number) => void): void {
    this.listener.emitter.off('scrollEnd', handler)
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

  let rightScrollbars = innerEl.getBoundingClientRect().right < el.getBoundingClientRect().right

  removeElement(el)

  return { system, leftScrollbars: !rightScrollbars }
}
