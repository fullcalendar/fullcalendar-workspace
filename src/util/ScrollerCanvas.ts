import * as $ from 'jquery'

/*
A rectangular area of content that lives within a Scroller.
Can have "gutters", areas of dead spacing around the perimeter.
Also very useful for forcing a width, which a Scroller cannot do alone.
Has a content area that lives above a background area.
*/
export default class ScrollerCanvas {

  el: any
  contentEl: any
  bgEl: any
  gutters: any // an object {top,left,bottom,right}
  width: any
  minWidth: any


  constructor() {
    this.gutters = {}
  }


  render() {
    this.el = $(`\
<div class="fc-scroller-canvas"> \
<div class="fc-content"></div> \
<div class="fc-bg"></div> \
</div>\
`)
    this.contentEl = this.el.find('.fc-content')
    this.bgEl = this.el.find('.fc-bg')
  }


  /*
  If falsy, resets all the gutters to 0
  */
  setGutters(gutters) {
    if (!gutters) {
      this.gutters = {}
    } else {
      $.extend(this.gutters, gutters)
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
    const { gutters } = this

    this.el // is border-box (width includes padding)
      .toggleClass('fc-gutter-left', Boolean(gutters.left))
      .toggleClass('fc-gutter-right', Boolean(gutters.right))
      .toggleClass('fc-gutter-top', Boolean(gutters.top))
      .toggleClass('fc-gutter-bottom', Boolean(gutters.bottom))
      .css({
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

    this.bgEl.css({
      left: gutters.left || '',
      right: gutters.right || '',
      top: gutters.top || '',
      bottom: gutters.bottom || ''
    })
  }

}
