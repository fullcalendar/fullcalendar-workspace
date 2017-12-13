import * as $ from 'jquery'
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
  renderSpreadsheetSkeleton(tr) {
    const contentEl = this.renderGroupContentEl()

    // add an expander icon. binding handlers and updating are done by RowParent
    contentEl.prepend(
      '<span class="fc-expander">' +
        '<span class="fc-icon"></span>' +
      '</span>'
    )

    return $('<td class="fc-divider" />')
      .attr('colspan', this.view.colSpecs.length) // span across all columns
      .append(
        $('<div/>').append(contentEl) // needed by setTrInnerHeight
      )
      .appendTo(tr)
  }

  /*
  Renders this row's TR for the quadrant that contains a resource's events
  */
  renderEventSkeleton(tr) {
    // insert a single cell, with a single empty <div> (needed by setTrInnerHeight).
    // there will be no content
    return tr.append(`\
<td class="fc-divider"> \
<div/> \
</td>\
`)
  }

}

HRowGroup.prototype.hasOwnRow = true // actually renders its own row and takes up height
