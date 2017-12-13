import * as $ from 'jquery'
import RowGroup from './RowGroup'

/*
A row grouping that renders as a tall multi-cell vertical span in the "spreadsheet" area
*/
export default class VRowGroup extends RowGroup {

  rowspan: number // the number of total rows (subparents included) this group spans
  leadingTr: any // the first real row's TR in the group
  groupTd: any


  constructor(view, groupSpec, groupValue) {
    super(view, groupSpec, groupValue)
    this.rowspan = 0
  }

  /*
  Makes sure the groupTd has the correct rowspan / place in the DOM.
  PRECONDITION: in the case of multiple group nesting, a child's renderRowspan()
  will be called before the parent's renderRowspan().
  */
  renderRowspan() {
    let leadingTr
    const { theme } = this.view.calendar

    if (this.rowspan) { // takes up at least one row?

      // ensure the TD element
      if (!this.groupTd) {
        this.groupTd = $('<td class="' + theme.getClass('widgetContent') + '"/>')
          .append(this.renderGroupContentEl())
      }

      this.groupTd.attr('rowspan', this.rowspan)

      // (re)insert groupTd if it was never inserted, or the first TR is different
      leadingTr = this.getLeadingRow().getTr('spreadsheet')
      if (leadingTr !== this.leadingTr) {
        if (leadingTr) { // might not exist if child was unrendered before parent
          leadingTr.prepend(this.groupTd) // parents will later prepend their own
        }
        this.leadingTr = leadingTr
      }

    } else { // takes up zero rows?

      // remove the TD element if it was rendered
      if (this.groupTd) {
        this.groupTd.remove()
        this.groupTd = null
      }

      this.leadingTr = null
    }
  }

  /*
  Called when a row somewhere within the grouping is shown
  */
  descendantShown(row) {
    this.rowspan += 1
    this.renderRowspan()
    super.descendantShown(row) // will bubble to parent
  }

  /*
  Called when a row somewhere within the grouping is hidden
  */
  descendantHidden(row) {
    this.rowspan -= 1
    this.renderRowspan()
    super.descendantHidden(row)
  }
}
