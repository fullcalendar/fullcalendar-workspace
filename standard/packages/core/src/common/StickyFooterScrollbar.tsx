import { watchHeight } from '../internal.js'
import { createElement, createRef, Ref } from '../preact.js'
import { Scroller } from '../scrollgrid/Scroller.js'
import { BaseComponent, setRef } from '../vdom-util.js'

export interface StickyFooterScrollbarProps {
  canvasWidth: number
  scrollerRef?: Ref<Scroller>
  scrollbarWidthRef?: Ref<number>
}

export class StickyFooterScrollbar extends BaseComponent<StickyFooterScrollbarProps> {
  rootElRef = createRef<HTMLDivElement>()
  disconnectHeight?: () => void

  render() {
    const { props } = this

    // NOTE: we need a wrapper around the Scroller because if scrollbars appear/hide,
    // the outer dimensions change, but the inner dimensions do not. The Scroller's
    // dimension-watching, when used in ponyfill-mode, can't fire on border-box change, so we
    // workaround it by monitoring dimensions of a wrapper instead
    return (
      <div ref={this.rootElRef} className='fc-sticky-footer-scrollbar'>
        <Scroller horizontal ref={props.scrollerRef}>
          <div style={{ width: props.canvasWidth }} />
        </Scroller>
      </div>
    )
  }

  componentDidMount(): void {
    this.disconnectHeight = watchHeight(this.rootElRef.current, (height) => {
      setRef(this.props.scrollbarWidthRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectHeight()
    setRef(this.props.scrollbarWidthRef, null)
  }
}
