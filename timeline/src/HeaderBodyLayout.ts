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


  render(props: HeaderBodyLayoutProps) {
    let headerScroller = this.renderHeaderScroller({
      parentEl: props.headerContainerEl,
      overflowX: 'clipped-scroll',
      overflowY: 'hidden'
    })

    let bodyScroller = this.renderBodyScroller({
      parentEl: props.bodyContainerEl,
      overflowX: 'auto',
      overflowY: props.verticalScroll
    })

    this.buildScrollJoiner({ headerScroller, bodyScroller })

    this.headerScroller = headerScroller
    this.bodyScroller = bodyScroller
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
    let { headerScroller, bodyScroller } = this
    let scrollJoiner = this.buildScrollJoiner.current
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryHeadHeight()
    }

    bodyScroller.setHeight(bodyHeight)
    headerScroller.updateSize() // adjusts gutters and classNames
    bodyScroller.updateSize() // adjusts gutters and classNames
    scrollJoiner.update()
  }


  queryHeadHeight() {
    return this.headerScroller.rootEl.getBoundingClientRect().height
  }


  queryTotalHeight() {
    return this.queryHeadHeight() +
      this.bodyScroller.rootEl.getBoundingClientRect().height
  }

}
