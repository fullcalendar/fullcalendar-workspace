import {
  h, ComponentChildren, createRef, Ref, BaseComponent, setRef, ComponentContext,
  CssDimValue, ScrollerLike,
  Scroller, OverflowValue,
  getScrollbarWidths,
  getIsRtlScrollbarOnLeft,
  componentNeedsResize
} from '@fullcalendar/core'


export type ClippedOverflowValue = OverflowValue | 'scroll-hidden'

export interface ClippedScrollerProps {
  overflowX: ClippedOverflowValue
  overflowY: ClippedOverflowValue
  vGrow: boolean
  maxHeight?: number // incompatible with vGrow
  children: ComponentChildren
  scrollerRef?: Ref<Scroller>
  scrollerElRef?: Ref<HTMLElement>
}

interface ClippedScrollerState {
  yScrollbarWidth?: number
  xScrollbarWidth?: number
}

const STATE_IS_SIZING = {
  yScrollbarWidth: true,
  xScrollbarWidth: true
}


export default class ClippedScroller extends BaseComponent<ClippedScrollerProps, ClippedScrollerState> implements ScrollerLike {

  private elRef = createRef<HTMLDivElement>()
  private scroller: Scroller

  state = { // HACK?
    xScrollbarWidth: getScrollbarWidths().x,
    yScrollbarWidth: getScrollbarWidths().y
  }


  render(props: ClippedScrollerProps, state: ClippedScrollerState, context: ComponentContext) {
    let isScrollbarOnLeft = context.isRtl && getIsRtlScrollbarOnLeft()

    // for normal scroller div
    let position: string = props.vGrow ? 'absolute' : ''
    let positionTop: CssDimValue = ''
    let positionLeft: CssDimValue = ''
    let positionRight: CssDimValue = ''
    let positionBottom: CssDimValue = ''
    let marginLeft: CssDimValue = ''
    let marginRight: CssDimValue = ''
    let marginBottom: CssDimValue = ''

    if (props.vGrow) {
      positionTop = 0
      positionLeft = 0
      positionRight = 0
      positionBottom = 0
    }

    if (props.overflowX === 'scroll-hidden') {
      if (props.vGrow) {
        positionBottom = -state.xScrollbarWidth
      } else {
        marginBottom = -state.xScrollbarWidth
      }
    }

    if (props.overflowY === 'scroll-hidden') {
      if (state.yScrollbarWidth != null) {
        if (isScrollbarOnLeft) {
          if (props.vGrow) {
            positionLeft = -state.yScrollbarWidth
          } else {
            marginLeft = -state.yScrollbarWidth
          }
        } else {
          if (props.vGrow) {
            positionRight = -state.yScrollbarWidth
          } else {
            marginRight = -state.yScrollbarWidth
          }
        }
      }
    }

    return (
      <div
        ref={this.elRef}
        class={'clippedscroller' + (props.vGrow ? ' vgrow' : '')}
      >
        <Scroller
          ref={this.handleScroller}
          elRef={this.props.scrollerElRef}
          overflowX={props.overflowX === 'scroll-hidden' ? 'scroll' : props.overflowX}
          overflowY={props.overflowY === 'scroll-hidden' ? 'scroll' : props.overflowY}
          maxHeight={typeof props.maxHeight === 'number' ? (props.maxHeight + (props.overflowX === 'scroll-hidden' ? state.xScrollbarWidth : 0)) : ''}
          style={{
            maxHeight: typeof props.maxHeight === 'number' ? (props.maxHeight + (props.overflowX === 'scroll-hidden' ? state.xScrollbarWidth : 0)) : '',
            position,
            top: positionTop,
            left: positionLeft,
            right: positionRight,
            bottom: positionBottom,
            marginLeft,
            marginRight,
            marginBottom
          }}
        >{props.children}</Scroller>
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


  componentDidUpdate(prevProps: ClippedScrollerProps, prevState: ClippedScrollerState) {
    if (componentNeedsResize(prevProps, this.props, prevState, this.state, STATE_IS_SIZING)) {
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
