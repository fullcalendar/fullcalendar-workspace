import { Component, renderer } from '@fullcalendar/core'
import ClippedScroller from './util/ClippedScroller'
import ScrollJoiner from './util/ScrollJoiner'

export interface HeaderBodyLayoutProps {
  headerContainerEl: HTMLElement
  bodyContainerEl: HTMLElement
  verticalScroll: 'auto' | 'clipped-scroll'
}

export default class HeaderBodyLayout extends Component<HeaderBodyLayoutProps> {

  renderHeaderScroller = renderer(ClippedScroller)
  renderBodyScroller = renderer(ClippedScroller)
  buildScrollJoiner = renderer(this._buildScrollJoiner, this._clearScrollerJoiner)

  headerScroller: ClippedScroller
  bodyScroller: ClippedScroller
  scrollJoiner: ScrollJoiner


  render(props: HeaderBodyLayoutProps) {
    let headerScroller = this.renderHeaderScroller(props.headerContainerEl, {
      overflowX: 'clipped-scroll',
      overflowY: 'hidden'
    })

    let bodyScroller = this.renderBodyScroller(props.bodyContainerEl, {
      overflowX: 'auto',
      overflowY: props.verticalScroll
    })

    let scrollJoiner = this.buildScrollJoiner(true, { headerScroller, bodyScroller })

    this.headerScroller = headerScroller
    this.bodyScroller = bodyScroller
    this.scrollJoiner = scrollJoiner
  }


  _buildScrollJoiner(props: { headerScroller: ClippedScroller, bodyScroller: ClippedScroller }) {
    return new ScrollJoiner('horizontal', [
      props.headerScroller,
      props.bodyScroller
    ])
  }


  _clearScrollerJoiner(scrollJoiner: ScrollJoiner) {
    scrollJoiner.destroy()
  }


  setHeight(totalHeight, isAuto) {
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryHeadHeight()
    }

    this.bodyScroller.setHeight(bodyHeight)

    this.headerScroller.updateSize() // adjusts gutters and classNames
    this.bodyScroller.updateSize() // adjusts gutters and classNames
    this.scrollJoiner.update()
  }


  queryHeadHeight() {
    return this.headerScroller.enhancedScroller.canvas.contentEl.getBoundingClientRect().height
  }

}
