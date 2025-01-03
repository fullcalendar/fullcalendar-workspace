import { isDimsEqual } from '../component-util/rendering-misc.js'
import { watchSize } from '../component-util/resize-observer.js'
import { DateComponent } from '../component/DateComponent.js'
import { joinClassNames } from '../util/html.js'
import { setRef } from '../vdom-util.js'
import { Dictionary } from '../options.js'
import { ComponentChildren, createElement, Ref } from '../preact.js'
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
  role?: string // weird
  rowIndex?: number // weird

  // dimensions
  clientWidthRef?: Ref<number> // for this to be accurate, element should NOT have left/right borders
  clientHeightRef?: Ref<number> // for this to be accurate, element should NOT have top/bottom borders
  endScrollbarWidthRef?: Ref<number>
  bottomScrollbarWidthRef?: Ref<number>
}

export class Scroller extends DateComponent<ScrollerProps> implements ScrollerInterface {
  // ref
  private el?: HTMLDivElement

  // internal
  public listener: ScrollListener // public for ScrollerSyncer
  private disconnectSize?: () => void
  private currentClientWidth: number
  private currentClientHeight: number
  private currentEndScrollbarWidth: number
  private currentBottomScrollbarWidth: number

  render() {
    const { props } = this

    // if there's only one axis that needs scrolling, the other axis will unintentionally have
    // scrollbars too if we don't force to 'hidden'
    const fallbackOverflow = (props.horizontal || props.vertical) ? 'hidden' : ''

    return (
      <div
        ref={this.handleEl}
        role={props.role as any /* !!! */}
        aria-rowindex={props.rowIndex}
        className={joinClassNames(
          props.className,
          'fc-scroller',
          props.hideScrollbars && 'fc-scroller-no-bars',
        )}
        style={{
          ...props.style,
          overflowX: props.horizontal ? 'auto' : fallbackOverflow,
          overflowY: props.vertical ? 'auto' : fallbackOverflow,
        }}
      >{props.children}</div>
    )
  }

  handleEl = (el: HTMLDivElement | null) => {
    const { props } = this

    if (this.el) {
      this.el = null
      this.listener.destroy()
      this.disconnectSize()

      setRef(props.clientWidthRef, null)
      setRef(props.clientHeightRef, null)
      setRef(props.endScrollbarWidthRef, null)
      setRef(props.bottomScrollbarWidthRef, null)
    }

    if (el) {
      this.el = el
      this.listener = new ScrollListener(el)

      this.disconnectSize = watchSize(el, (clientWidth, clientHeight) => {
        const { props } = this
        const endScrollbarWidth = el.offsetWidth - clientWidth
        const bottomScrollbarWidth = el.offsetHeight - clientHeight

        if (this.currentClientWidth !== clientWidth) {
          setRef(props.clientWidthRef, this.currentClientWidth = clientWidth)
        }
        if (this.currentClientHeight !== clientHeight) {
          setRef(props.clientHeightRef, this.currentClientHeight = clientHeight)
        }

        // are these isDimsEqual calls necessary?

        if (!isDimsEqual(this.currentBottomScrollbarWidth, bottomScrollbarWidth)) {
          setRef(props.bottomScrollbarWidthRef, this.currentBottomScrollbarWidth = bottomScrollbarWidth)
        }
        if (!isDimsEqual(this.currentEndScrollbarWidth, endScrollbarWidth)) {
          setRef(props.endScrollbarWidthRef, this.currentEndScrollbarWidth = endScrollbarWidth)
        }
      }, /* client(width+height) = */ true)
    }
  }

  endScroll() {
    this.listener.endScroll()
  }

  // Public API
  // -----------------------------------------------------------------------------------------------

  get x(): number {
    const { isRtl } = this.context
    const { el } = this
    return el ? getNormalizedScrollX(el, isRtl) : 0
  }

  get y(): number {
    const { el } = this
    return el ? el.scrollTop : 0
  }

  scrollTo({ x, y }: { x?: number, y?: number }): void {
    const { isRtl } = this.context
    const { el } = this

    if (el) {
      if (y != null) {
        el.scrollTop = y
      }

      if (x != null) {
        setNormalizedScrollX(el, isRtl, x)
      }
    }
  }

  addScrollEndListener(handler: (arg: { x: number, y: number, isUser: boolean }) => void): void {
    this.listener.emitter.on('scrollEnd', handler)
  }

  removeScrollEndListener(handler: (arg: { x: number, y: number, isUser: boolean }) => void): void {
    this.listener.emitter.off('scrollEnd', handler)
  }
}

// Public API
// -------------------------------------------------------------------------------------------------
// We can drop normalization when support for Chromium-based <86 is dropped (see Notion)

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
  switch (getRtlScrollerSystem()) {
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
  switch (getRtlScrollerSystem()) {
    case 'positive':
      return el.scrollWidth - el.clientWidth - x
    case 'negative':
      return -x
  }
  return x
}

// Detection
// -------------------------------------------------------------------------------------------------

type RtlScrollerSystem = 'positive' | 'negative' | 'reverse'

let _rtlScrollerSystem: RtlScrollerSystem | undefined

function getRtlScrollerSystem(): RtlScrollerSystem {
  return _rtlScrollerSystem || (_rtlScrollerSystem = detectRtlScrollerSystem())
}

/*
TODO: make this more minimal now that scrollbar-side detection isn't needed?
*/
function detectRtlScrollerSystem(): RtlScrollerSystem {
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

  el.remove()

  return system
}
