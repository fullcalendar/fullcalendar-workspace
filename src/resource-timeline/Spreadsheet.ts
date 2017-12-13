import * as $ from 'jquery'
import { htmlEscape, DragListener } from 'fullcalendar'
import ClippedScroller from '../util/ClippedScroller'
import ScrollerCanvas from '../util/ScrollerCanvas'
import ScrollJoiner from '../util/ScrollJoiner'
import ScrollFollower from '../util/ScrollFollower'
import VRowGroup from './row/VRowGroup'

const COL_MIN_WIDTH = 30


export default class Spreadsheet {

  view: any
  isRTL: boolean
  headEl: any
  el: any // for body
  tbodyEl: any
  headScroller: any
  bodyScroller: any
  scrollJoiner: any
  cellFollower: any

  // rendering
  colGroupHtml: string
  headTable: any
  headColEls: any
  headCellEls: any
  bodyColEls: any
  bodyTable: any

  // column resizing
  givenColWidths: any
  colWidths: any
  colMinWidths: any
  tableWidth: any
  tableMinWidth: any


  constructor(view) {
    this.colGroupHtml = ''
    this.view = view
    this.isRTL = this.view.opt('isRTL') // doesn't descend from Grid, so needs to do this

    this.givenColWidths = this.colWidths =
      this.view.colSpecs.map((colSpec) => colSpec.width)
  }


  renderSkeleton() {
    const { theme } = this.view.calendar

    this.headScroller = new ClippedScroller({
      overflowX: 'clipped-scroll',
      overflowY: 'hidden'
    })
    this.headScroller.canvas = new ScrollerCanvas()
    this.headScroller.render()
    this.headScroller.canvas.contentEl.html(this.renderHeadHtml())
    this.headEl.append(this.headScroller.el)

    this.bodyScroller = new ClippedScroller({ overflowY: 'clipped-scroll' })
    this.bodyScroller.canvas = new ScrollerCanvas()
    this.bodyScroller.render()
    this.bodyScroller.canvas.contentEl.html(
      `<div class="fc-rows"> \
<table class="` + theme.getClass('tableGrid') + `">\
` + this.colGroupHtml + `<tbody/> \
</table> \
</div>`
    ) // colGroupHtml hack
    this.tbodyEl = this.bodyScroller.canvas.contentEl.find('tbody')
    this.el.append(this.bodyScroller.el)

    this.scrollJoiner = new ScrollJoiner('horizontal', [ this.headScroller, this.bodyScroller ])

    this.headTable = this.headEl.find('table')
    this.headColEls = this.headEl.find('col')
    this.headCellEls = this.headScroller.canvas.contentEl.find('tr:last-child th')
    this.bodyColEls = this.el.find('col')
    this.bodyTable = this.el.find('table')

    this.colMinWidths = this.computeColMinWidths()
    this.applyColWidths()
    this.initColResizing()
  }


  renderHeadHtml() {
    const { theme } = this.view.calendar
    const { colSpecs } = this.view

    let html = '<table class="' + theme.getClass('tableGrid') + '">'

    let colGroupHtml = '<colgroup>'
    for (let o of colSpecs) {
      if (o.isMain) {
        colGroupHtml += '<col class="fc-main-col"/>'
      } else {
        colGroupHtml += '<col/>'
      }
    }

    colGroupHtml += '</colgroup>'
    this.colGroupHtml = colGroupHtml
    html += colGroupHtml

    html += '<tbody>'

    if (this.view.superHeaderText) {
      html +=
        '<tr class="fc-super">' +
          '<th class="' + theme.getClass('widgetHeader') + '" colspan="' + colSpecs.length + '">' +
            '<div class="fc-cell-content">' +
              '<span class="fc-cell-text">' +
                htmlEscape(this.view.superHeaderText) +
              '</span>' +
            '</div>' +
          '</th>' +
        '</tr>'
    }

    html += '<tr>'

    for (let i = 0; i < colSpecs.length; i++) {
      let o = colSpecs[i]
      const isLast = i === (colSpecs.length - 1)

      html +=
        `<th class="` + theme.getClass('widgetHeader') + `">` +
          '<div>' +
            '<div class="fc-cell-content">' +
              (o.isMain ?
                '<span class="fc-expander-space">' +
                  '<span class="fc-icon"></span>' +
                '</span>' :
                '') +
              '<span class="fc-cell-text">' +
                htmlEscape(o.labelText || '') + // what about normalizing this value ahead of time?
              '</span>' +
            '</div>' +
            (!isLast ? '<div class="fc-col-resizer"></div>' : '') +
          '</div>' +
        '</th>'
    }

    html += '</tr>'
    html += '</tbody></table>'

    return html
  }


  initColResizing() {
    this.headEl.find('th .fc-col-resizer').each((i, resizerEl) => {
      resizerEl = $(resizerEl)
      resizerEl.on('mousedown', ev => {
        this.colResizeMousedown(i, ev, resizerEl)
      })
    })
  }


  colResizeMousedown(i, ev, resizerEl) {
    const colWidths = (this.colWidths = this.queryColWidths())
    colWidths.pop()
    colWidths.push(null) // will result in 'auto' or ''

    const origColWidth = colWidths[i]
    const minWidth = Math.min(this.colMinWidths[i], COL_MIN_WIDTH) // if given width is smaller, allow it

    const dragListener = new DragListener({
      dragStart: () => {
        resizerEl.addClass('fc-active')
      },
      drag: (dx, dy) => {
        let width = origColWidth + (this.isRTL ? -dx : dx)
        width = Math.max(width, minWidth)
        colWidths[i] = width
        this.applyColWidths()
      },
      dragEnd: () => {
        resizerEl.removeClass('fc-active')
      }
    })

    dragListener.startInteraction(ev)
  }


  applyColWidths() {
    let cssWidth
    let i
    let colWidth
    const { colMinWidths } = this
    const { colWidths } = this
    let allNumbers = true
    let anyPercentages = false
    let total = 0

    for (colWidth of colWidths) {
      if (typeof colWidth === 'number') {
        total += colWidth
      } else {
        allNumbers = false
        if (colWidth) {
          anyPercentages = true
        }
      }
    }

    // percentage widths play better with 'auto' but h-grouped cells don't
    const defaultCssWidth =
      anyPercentages && !this.view.isHGrouping ?
        'auto' :
        ''

    const cssWidths = colWidths.map((colWidth) => (
      colWidth != null ? colWidth : defaultCssWidth
    ))

    // if allNumbers
    //    cssWidths.pop()
    //    cssWidths.push('auto')

    let tableMinWidth = 0
    for (i = 0; i < cssWidths.length; i++) {
      cssWidth = cssWidths[i]
      tableMinWidth +=
        typeof cssWidth === 'number' ?
          cssWidth :
          colMinWidths[i]
    }

    for (i = 0; i < cssWidths.length; i++) {
      cssWidth = cssWidths[i]
      this.headColEls.eq(i).css('width', cssWidth)
      this.bodyColEls.eq(i).css('width', cssWidth)
    }

    this.headScroller.canvas.setMinWidth(tableMinWidth) // not really a table width anymore
    this.bodyScroller.canvas.setMinWidth(tableMinWidth)

    this.tableMinWidth = tableMinWidth
    this.tableWidth = allNumbers ? total : undefined
  }


  computeColMinWidths() {
    return this.givenColWidths.map((width, i) => (
      typeof width === 'number' ?
        width :
        parseInt(this.headColEls.eq(i).css('min-width'), 10) || COL_MIN_WIDTH
    ))
  }


  queryColWidths() {
    return this.headCellEls.map((i, node) => (
      $(node).outerWidth()
    )).get()
  }


  // Sizing
  // ---------------------------------------------------------------------------------


  updateSize() {
    this.headScroller.updateSize()
    this.bodyScroller.updateSize()
    this.scrollJoiner.update()
    this.updateCellFollower()
  }


  headHeight() { // TODO: route this better
    const table = this.headScroller.canvas.contentEl.find('table')
    return table.height.apply(table, arguments)
  }


  // completely reninitializes every time there's add/remove
  // TODO: optimize
  updateCellFollower() {
    if (this.cellFollower) {
      this.cellFollower.clearSprites() // the closest thing to a destroy
    }

    this.cellFollower = new ScrollFollower(this.bodyScroller, true) // allowPointerEvents
    this.cellFollower.isHFollowing = false
    this.cellFollower.isVFollowing = true

    const nodes = []
    for (let row of this.view.rowHierarchy.getNodes()) {
      if (row instanceof VRowGroup) {
        if (row.groupTd) {
          const cellContent = row.groupTd.find('.fc-cell-content')
          if (cellContent.length) {
            nodes.push(cellContent[0])
          }
        }
      }
    }

    this.cellFollower.setSpriteEls($(nodes))
    this.cellFollower.update()
  }
}
