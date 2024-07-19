import {
  BaseComponent,
  setRef,
  ScrollerLike,
  Scroller, OverflowValue,
  getIsRtlScrollbarOnLeft,
  isPropsEqual,
} from '@fullcalendar/core/internal'
import {
  createElement,
  ComponentChildren,
  createRef,
  Ref,
} from '@fullcalendar/core/preact'

export type ClippedOverflowValue = OverflowValue | 'scroll-hidden'

export interface ClippedScrollerProps {
  overflowX: ClippedOverflowValue
  overflowY: ClippedOverflowValue
  forPrint: boolean
  liquid: boolean
  maxHeight?: number // incompatible with liquid
  children?: ComponentChildren
  scrollerRef?: Ref<Scroller>
  scrollerElRef?: Ref<HTMLElement>
}

interface ClippedScrollerState {
  yScrollbarWidth?: number
  xScrollbarWidth?: number
}

interface ClippedScrollerSnapshot {
  simulateScrollLeft?: number
}

export class ClippedScroller extends BaseComponent<ClippedScrollerProps, ClippedScrollerState> implements ScrollerLike {
  private elRef = createRef<HTMLDivElement>()
  private scroller: Scroller

  state = {
    xScrollbarWidth: 0,
    yScrollbarWidth: 0,
  }

  render() {
    let { props, state, context } = this
    let isScrollbarOnLeft = context.isRtl && getIsRtlScrollbarOnLeft()
    let overcomeLeft = 0
    let overcomeRight = 0
    let overcomeBottom = 0

    let { overflowX, overflowY } = props
    if (props.forPrint) {
      overflowX = 'visible'
      overflowY = 'visible'
    }

    if (overflowX === 'scroll-hidden') {
      overcomeBottom = state.xScrollbarWidth
    }

    if (overflowY === 'scroll-hidden') {
      if (state.yScrollbarWidth != null) {
        if (isScrollbarOnLeft) {
          overcomeLeft = state.yScrollbarWidth
        } else {
          overcomeRight = state.yScrollbarWidth
        }
      }
    }

    return (
      <div
        ref={this.elRef}
        className={'fc-scroller-harness' + (props.liquid ? ' fc-scroller-harness-liquid' : '')}
      >
        <Scroller
          ref={this.handleScroller}
          elRef={this.props.scrollerElRef}
          overflowX={overflowX === 'scroll-hidden' ? 'scroll' : overflowX}
          overflowY={overflowY === 'scroll-hidden' ? 'scroll' : overflowY}
          overcomeLeft={overcomeLeft}
          overcomeRight={overcomeRight}
          overcomeBottom={overcomeBottom}
          maxHeight={
            typeof props.maxHeight === 'number'
              ? (props.maxHeight + (overflowX === 'scroll-hidden' ? state.xScrollbarWidth : 0))
              : ''
          }
          liquid={props.liquid}
          liquidIsAbsolute
        >
          {props.children}
        </Scroller>
      </div>
    )
  }

  handleScroller = (scroller: Scroller) => {
    this.scroller = scroller
    setRef(this.props.scrollerRef, scroller)
  }

  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }

  getSnapshotBeforeUpdate(prevProps: Readonly<ClippedScrollerProps>): ClippedScrollerSnapshot {
    if (this.props.forPrint && !prevProps.forPrint) {
      return { simulateScrollLeft: this.scroller.el.scrollLeft }
    }
    return {}
  }

  componentDidUpdate(prevProps: ClippedScrollerProps, prevState: ClippedScrollerState, snapshot: ClippedScrollerSnapshot) {
    const { props, scroller: { el: scrollerEl } } = this

    if (!isPropsEqual(prevProps, props)) { // an external change?
      this.handleSizing()
    }

    if (snapshot.simulateScrollLeft !== undefined) {
      scrollerEl.style.left = -snapshot.simulateScrollLeft + 'px'
    } else if (!props.forPrint && prevProps.forPrint) {
      const restoredScrollLeft = -parseInt(scrollerEl.style.left)
      scrollerEl.style.left = ''
      scrollerEl.scrollLeft = restoredScrollLeft
    }
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }

  handleSizing = () => {
    let { props } = this

    if (props.overflowY === 'scroll-hidden') {
      this.setState({ yScrollbarWidth: this.scroller.getYScrollbarWidth() })
    }

    if (props.overflowX === 'scroll-hidden') {
      this.setState({ xScrollbarWidth: this.scroller.getXScrollbarWidth() })
    }
  }

  needsXScrolling() {
    return this.scroller.needsXScrolling()
  }

  needsYScrolling() {
    return this.scroller.needsYScrolling()
  }
}
