import { CssDimValue } from '../scrollgrid/util.js'
import { watchHeight } from '../component-util/resize-observer.js'
import { createElement, createRef, Ref } from '../preact.js'
import { Scroller } from '../scrollgrid/Scroller.js'
import { BaseComponent, setRef } from '../vdom-util.js'
import { joinClassNames } from '../util/html.js'
import classNames from '../internal-classnames.js'

export interface FooterScrollbarProps {
  isSticky?: boolean
  canvasWidth: CssDimValue
  scrollerRef?: Ref<Scroller>
  scrollbarWidthRef?: Ref<number>
}

export class FooterScrollbar extends BaseComponent<FooterScrollbarProps> {
  rootElRef = createRef<HTMLDivElement>()
  disconnectHeight?: () => void

  render() {
    const { props } = this

    // NOTE: we need a wrapper around the Scroller because if scrollbars appear/hide,
    // the outer dimensions change, but the inner dimensions do not. The Scroller's
    // dimension-watching, when used in ponyfill-mode, can't fire on border-box change, so we
    // workaround it by monitoring dimensions of a wrapper instead
    return (
      <div
        ref={this.rootElRef}
        className={joinClassNames(
          classNames.footerScrollbar,
          props.isSticky && classNames.footerScrollbarSticky,
        )}
      >
        <Scroller horizontal ref={props.scrollerRef}>
          <div style={{ minWidth: props.canvasWidth }} />
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
