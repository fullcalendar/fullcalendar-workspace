import { BaseComponent, ComponentContext, subrenderer } from '@fullcalendar/core'
import { h, ComponentChildren, createRef } from 'preact'
import ClippedScroller from './util/ClippedScroller'
import ScrollJoiner from './util/ScrollJoiner'


export interface TimelineViewLayoutProps {
  headContent: ComponentChildren
  bodyBgContent: ComponentChildren
}

export default class TimelineViewLayout extends BaseComponent<TimelineViewLayoutProps> {

  private getScrollJoiner = subrenderer(ScrollJoiner)
  private rootElRef = createRef<HTMLTableElement>()
  private headClippedScrollerRef = createRef<ClippedScroller>()
  private bodyClippedScrollerRef = createRef<ClippedScroller>()

  get headClippedScroller() { return this.headClippedScrollerRef.current }
  get bodyClippedScroller() { return this.bodyClippedScrollerRef.current }


  render(props: TimelineViewLayoutProps, state: {}, context: ComponentContext) {
    let { theme } = context

    return (
      <table class={theme.getClass('tableGrid')} ref={this.rootElRef}>
        <thead class='fc-head'>
          <tr>
            <td class={'fc-time-area ' + theme.getClass('widgetHeader')}>
              <ClippedScroller
                ref={this.headClippedScrollerRef}
                overflowX='clipped-scroll'
                overflowY='hidden'
                fgContent={props.headContent}
              />
            </td>
          </tr>
        </thead>
        <tbody class='fc-body'>
          <tr>
            <td class={'fc-time-area ' + theme.getClass('widgetContent')}>
              <ClippedScroller
                ref={this.bodyClippedScrollerRef}
                overflowX='auto'
                overflowY='auto'
                bgContent={props.bodyBgContent}
              />
            </td>
          </tr>
        </tbody>
      </table>
    )
  }


  componentWillUnmount() {
    this.subrenderDestroy()
  }


  getAvailableWidth() {
    let bodyScroller = this.bodyClippedScrollerRef.current

    return bodyScroller.enhancedScroller.scroller.controller.getClientWidth()
  }


  setWidths(containerWidth, containerMinWidth) {
    let headCanvas = this.headClippedScrollerRef.current.canvas
    let bodyCanvas = this.bodyClippedScrollerRef.current.canvas

    headCanvas.setWidth(containerWidth)
    headCanvas.setMinWidth(containerMinWidth)
    bodyCanvas.setWidth(containerWidth)
    bodyCanvas.setMinWidth(containerMinWidth)
  }


  setHeight(totalHeight, isAuto) {
    let headScroller = this.headClippedScrollerRef.current
    let bodyScroller = this.bodyClippedScrollerRef.current
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryNonBodyHeight()
    }

    bodyScroller.setHeight(bodyHeight)

    // adjusts gutters and classNames
    headScroller.updateSize()
    bodyScroller.updateSize()

    this.getScrollJoiner({
      axis: 'horizontal',
      scrollers: [ headScroller, bodyScroller ]
    }).updateSize()
  }


  updateStickyScrolling() {
    let headScroller = this.headClippedScrollerRef.current
    let bodyScroller = this.bodyClippedScrollerRef.current

    headScroller.enhancedScroller.updateStickyScrolling()
    bodyScroller.enhancedScroller.updateStickyScrolling()
  }


  queryNonBodyHeight() {
    let rootEl = this.rootElRef.current
    let bodyScroller = this.bodyClippedScrollerRef.current

    return rootEl.getBoundingClientRect().height - bodyScroller.clipEl.getBoundingClientRect().height
  }

}
