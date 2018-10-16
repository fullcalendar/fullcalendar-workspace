import ClippedScroller from '../util/ClippedScroller'
import ScrollJoiner from '../util/ScrollJoiner'
import ScrollerCanvas from '../util/ScrollerCanvas'
import SimpleComponent from './SimpleComponent'

export default class HeaderBodyLayout extends SimpleComponent {

  headerScroller: ClippedScroller
  bodyScroller: ClippedScroller
  scrollJoiner: ScrollJoiner

  /*
  verticalScroll = 'auto' | 'clipped-scroll'
  */
  setParents(headerContainerEl, bodyContainerEl, verticalScroll) {
    this.headerScroller = new ClippedScroller('clipped-scroll', 'hidden')
    this.headerScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.headerScroller.setParent(headerContainerEl)

    this.bodyScroller = new ClippedScroller('auto', verticalScroll)
    this.bodyScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.bodyScroller.setParent(bodyContainerEl)

    this.scrollJoiner = new ScrollJoiner('horizontal', [
      this.headerScroller.enhancedScroll,
      this.bodyScroller.enhancedScroll
    ])
  }

  removeElements() {
    this.headerScroller.removeElement()
    this.bodyScroller.removeElement()
  }

  updateSize(totalHeight, isAuto) {
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryHeadHeight()
    }

    this.bodyScroller.setHeight(bodyHeight) // doesn't this double-render?
    this.headerScroller.updateSize()
    this.bodyScroller.updateSize()
    this.scrollJoiner.update()
  }

  queryHeadHeight() {
    return this.headerScroller.enhancedScroll.canvas.contentEl.offsetHeight // flawed???
  }

}
