import { applyStyle, forceClassName, BaseComponent } from '@fullcalendar/core'
import { __assign } from 'tslib'
import { h, createRef, ComponentChildren } from 'preact'

export interface ScrollerCanvasProps {
  fgContent: ComponentChildren
  bgContent: ComponentChildren
}

/*
A rectangular area of content that lives within a Scroller.
Can have "gutters", areas of dead spacing around the perimeter.
Also very useful for forcing a width, which a Scroller cannot do alone.
Has a content area that lives above a background area.
*/
export default class ScrollerCanvas extends BaseComponent<ScrollerCanvasProps> {

  private gutters = {} as any // an object {top,left,bottom,right}
  private width: any
  private minWidth: any
  private rootElRef = createRef<HTMLDivElement>()
  private contentElRef = createRef<HTMLDivElement>()
  private bgElRef = createRef<HTMLDivElement>()

  get rootEl() { return this.rootElRef.current }
  get fgEl() { return this.contentElRef.current }
  get bgEl() { return this.bgElRef.current }


  render(props: ScrollerCanvasProps) {
    return (
      <div class='fc-scroller-canvas' ref={this.rootElRef}>
        <div class='fc-content' ref={this.contentElRef}>
          {props.fgContent}
        </div>
        <div class='fc-bg' ref={this.bgElRef}>
          {props.bgContent}
        </div>
      </div>
    )
  }


  /*
  If falsy, resets all the gutters to 0
  */
  setGutters(gutters) {
    if (!gutters) {
      this.gutters = {}
    } else {
      __assign(this.gutters, gutters)
    }
    this.updateSize()
  }


  setWidth(width) {
    this.width = width
    this.updateSize()
  }


  setMinWidth(minWidth) {
    this.minWidth = minWidth
    this.updateSize()
  }


  clearWidth() {
    this.width = null
    this.minWidth = null
    this.updateSize()
  }


  updateSize() {
    let { gutters, rootEl } = this

    // is border-box (width includes padding)
    forceClassName(rootEl, 'fc-gutter-left', gutters.left)
    forceClassName(rootEl, 'fc-gutter-right', gutters.right)
    forceClassName(rootEl, 'fc-gutter-top', gutters.top)
    forceClassName(rootEl, 'fc-gutter-bottom', gutters.bottom)

    applyStyle(rootEl, {
      paddingLeft: gutters.left || '',
      paddingRight: gutters.right || '',
      paddingTop: gutters.top || '',
      paddingBottom: gutters.bottom || '',
      width:
        (this.width != null) ?
          this.width + (gutters.left || 0) + (gutters.right || 0) :
          '',
      minWidth:
        (this.minWidth != null) ?
          this.minWidth + (gutters.left || 0) + (gutters.right || 0) :
          ''
    })

    applyStyle(this.bgEl, {
      left: gutters.left || '',
      right: gutters.right || '',
      top: gutters.top || '',
      bottom: gutters.bottom || ''
    })
  }

}
