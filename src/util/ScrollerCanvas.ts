import { assignTo, htmlToElement, applyStyle } from 'fullcalendar'

/*
A rectangular area of content that lives within a Scroller.
Can have "gutters", areas of dead spacing around the perimeter.
Also very useful for forcing a width, which a Scroller cannot do alone.
Has a content area that lives above a background area.
*/
export default class ScrollerCanvas {

  el: HTMLElement
  contentEl: HTMLElement
  bgEl: HTMLElement
  gutters: any // an object {top,left,bottom,right}
  width: any
  minWidth: any


  constructor() {
    this.gutters = {}
  }


  render() {
    this.el = htmlToElement(`\
<div class="fc-scroller-canvas"> \
<div class="fc-content"></div> \
<div class="fc-bg"></div> \
</div>\
`)
    this.contentEl = this.el.querySelector('.fc-content')
    this.bgEl = this.el.querySelector('.fc-bg')
  }


  /*
  If falsy, resets all the gutters to 0
  */
  setGutters(gutters) {
    if (!gutters) {
      this.gutters = {}
    } else {
      assignTo(this.gutters, gutters)
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
    const { gutters, el } = this

    // is border-box (width includes padding)
    el.classList.toggle('fc-gutter-left', gutters.left)
    el.classList.toggle('fc-gutter-right', gutters.right)
    el.classList.toggle('fc-gutter-top', gutters.top)
    el.classList.toggle('fc-gutter-bottom', gutters.bottom)

    applyStyle(el, {
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
