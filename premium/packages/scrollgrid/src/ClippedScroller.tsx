import {
  createElement, ComponentChildren, createRef, Ref, BaseComponent, setRef,
  ScrollerLike,
  Scroller, OverflowValue,
  getIsRtlScrollbarOnLeft,
  isPropsEqual,
} from '@fullcalendar/common'

export type ClippedOverflowValue = OverflowValue | 'scroll-hidden'

export interface ClippedScrollerProps {
  overflowX: ClippedOverflowValue
  overflowY: ClippedOverflowValue
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

    if (props.overflowX === 'scroll-hidden') {
      overcomeBottom = state.xScrollbarWidth
    }

    if (props.overflowY === 'scroll-hidden') {
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
          overflowX={props.overflowX === 'scroll-hidden' ? 'scroll' : props.overflowX}
          overflowY={props.overflowY === 'scroll-hidden' ? 'scroll' : props.overflowY}
          overcomeLeft={overcomeLeft}
          overcomeRight={overcomeRight}
          overcomeBottom={overcomeBottom}
          maxHeight={
            typeof props.maxHeight === 'number'
              ? (props.maxHeight + (props.overflowX === 'scroll-hidden' ? state.xScrollbarWidth : 0))
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

  componentDidUpdate(prevProps: ClippedScrollerProps) {
    if (!isPropsEqual(prevProps, this.props)) { // an external change?
      this.handleSizing()
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
