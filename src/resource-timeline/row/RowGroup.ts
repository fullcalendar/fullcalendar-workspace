import * as $ from 'jquery'
import RowParent from './RowParent'

/*
An abstract node in a row-hierarchy tree that contains other nodes.
Will have some sort of rendered label indicating the grouping,
up to the subclass for determining what to do with it.
*/
export default class RowGroup extends RowParent {

  groupSpec: any // information about the field by which we are grouping {field,order,text,render}
  groupValue: any


  constructor(view, groupSpec, groupValue) {
    super(view)
    this.groupSpec = groupSpec
    this.groupValue = groupValue
  }

  /*
  Called when this row (if it renders a row) or a subrow is removed
  */
  descendantRemoved(row) {
    super.descendantRemoved(row) // bubble up to the view and let the node be fully removed

    // and there are no more children in the group, implictly remove this group as well
    if (!this.children.length) {
      this.removeFromParentAndDom()
    }
  }

  /*
  Renders the content wrapper element that will be inserted into this row's TD cell
  */
  renderGroupContentEl() {
    let contentEl = $('<div class="fc-cell-content" />')
      .append(this.renderGroupTextEl())

    const filter = this.groupSpec.render
    if (typeof filter === 'function') {
      contentEl = filter(contentEl, this.groupValue) || contentEl
    }

    return contentEl
  }

  /*
  Renders the text span element that will be inserted into this row's TD cell.
  Goes within the content element.
  */
  renderGroupTextEl() {
    let text = this.groupValue || '' // might be null/undefined if an ad-hoc grouping

    const filter = this.groupSpec.text
    if (typeof filter === 'function') {
      text = filter(text) || text
    }

    return $('<span class="fc-cell-text" />').text(text)
  }

}
