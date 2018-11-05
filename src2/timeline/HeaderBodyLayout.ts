import ClippedScroller from '../util/ClippedScroller'
import ScrollJoiner from '../util/ScrollJoiner'
import ScrollerCanvas from '../util/ScrollerCanvas'

export default class HeaderBodyLayout {

  headerScroller: ClippedScroller
  bodyScroller: ClippedScroller
  scrollJoiner: ScrollJoiner

  /*
  verticalScroll = 'auto' | 'clipped-scroll'
  */
  constructor(headerContainerEl, bodyContainerEl, verticalScroll) {
    this.headerScroller = new ClippedScroller('clipped-scroll', 'hidden', headerContainerEl)
    this.headerScroller.enhancedScroll.canvas = new ScrollerCanvas()

    this.bodyScroller = new ClippedScroller('auto', verticalScroll, bodyContainerEl)
    this.bodyScroller.enhancedScroll.canvas = new ScrollerCanvas()

    this.scrollJoiner = new ScrollJoiner('horizontal', [
      this.headerScroller,
      this.bodyScroller
    ])
  }

  destroy() {
    this.headerScroller.destroy()
    this.bodyScroller.destroy()
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
    return this.headerScroller.enhancedScroll.canvas.contentEl.offsetHeight // flawed?
  }

}
