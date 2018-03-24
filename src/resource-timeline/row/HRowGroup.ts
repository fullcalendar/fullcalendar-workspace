import { appendToElement, prependToElement, createElement } from 'fullcalendar'
import RowGroup from './RowGroup'

/*
A row grouping that renders as a single solid row that spans width-wise (like a horizontal rule)
*/
export default class HRowGroup extends RowGroup {

  renderSkeleton() {
    super.renderSkeleton()
    this.updateExpandingEnabled()
  }

  /*
  Renders this row's TR for the "spreadsheet" quadrant, the area with info about each resource
  */
  renderSpreadsheetSkeleton(tr: HTMLElement) {
    const contentEl = this.renderGroupContentEl()

    // add an expander icon. binding handlers and updating are done by RowParent
    prependToElement(
      contentEl,
      '<span class="fc-expander">' +
        '<span class="fc-icon"></span>' +
      '</span>'
    )

    tr.appendChild(
      createElement('td', {
        className: 'fc-divider',
        colSpan: this.view.colSpecs.length // span across all columns
      }, createElement('div', null, contentEl)) // needed by setTrInnerHeight
    )
  }

  /*
  Renders this row's TR for the quadrant that contains a resource's events
  */
  renderEventSkeleton(tr: HTMLElement) {
    // insert a single cell, with a single empty <div> (needed by setTrInnerHeight).
    // there will be no content
    appendToElement(tr, `\
  <td class="fc-divider"> \
  <div></div>\
  </td>\
  `)
    return tr
  }

}

HRowGroup.prototype.hasOwnRow = true // actually renders its own row and takes up height
