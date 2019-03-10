import EnhancedScroller from './EnhancedScroller'

export default class StickyScroller {

  scroller: EnhancedScroller

  constructor(scroller: EnhancedScroller) {
    this.scroller = scroller
    console.log('sticky', scroller.el)
  }

  addEls(els: HTMLElement[]) {
    console.log('add', els)
  }

  removeEls(els: HTMLElement[]) {
    console.log('remove', els)
  }

  resetEls(els: HTMLElement[]) { // TODO: remove
    console.log('reset', els)
  }

  destroy() {
    console.log('destroy', this.scroller)
  }

  updateSize() {
    console.log('updateSize', this.scroller.el)
  }

}
