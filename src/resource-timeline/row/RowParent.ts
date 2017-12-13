import * as $ from 'jquery'
import { DateComponent, capitaliseFirstLetter, proxy } from 'fullcalendar'
import { getOwnCells } from '../../util/util'

/*
An abstract node in a row-hierarchy tree.
May be a self-contained single row, a row with subrows,
OR a grouping of rows without its own distinct row.
*/
export default class RowParent extends DateComponent {

  view: any // the calendar View object. all nodes have this
  parent: any // parent node. null if topmost parent
  prevSibling: any // node before this node. null if first sibling
  children: any // array of child nodes
  depth: number // number of row-levels deep from top of hierarchy. Nodes without rows aren't counted

  hasOwnRow: boolean // is this node responsible for rendering its own distinct row? (initialized after class)
  trHash: any // TR jq objects owned by the node. keyed by "type" (parallel row sections in different tbodies)
  trs: any // single jQuery object of tr elements owned by the node.

  isExpanded: boolean // does this node have its child nodes revealed?


  constructor(view) {
    super(view) // will assign this.view
    this.children = []
    this.depth = 0
    this.trHash = {}
    this.trs = $()
    this.isExpanded = this.view.opt('resourcesInitiallyExpanded')
  }


  // Hierarchy
  // ------------------------------------------------------------------------------------------------------------------

  /*
  Adds the given node as a child.
  Will be inserted at the `index`. If not given, will be appended to the end.
  */
  addChildRowNode(child, index?) {
    child.removeFromParentAndDom() // in case it belonged somewhere else previously
    const { children } = this

    // insert into the children array
    if (index != null) {
      children.splice(index, 0, child)
    } else {
      index = children.length
      children.push(child)
    }

    // compute the previous sibling of child
    child.prevSibling =
      index > 0 ?
        children[index - 1] :
        null

    // update the next sibling's prevSibling
    if (index < (children.length - 1)) {
      children[index + 1].prevSibling = child
    }

    child.parent = this
    child.depth = this.depth + (this.hasOwnRow ? 1 : 0)

    this.descendantAdded(child)
  }


  /*
  Removes the given child from the node. Assumes it is a direct child.
  If not a direct child, returns false and nothing happens.
  */
  removeChild(child) {
    let i
    const { children } = this
    let isFound = false

    // look for the node in the children array
    for (i = 0; i < children.length; i++) {
      const testChild = children[i]
      if (testChild === child) { // found!
        isFound = true
        break // after this, `i` will contain the index
      }
    }

    if (!isFound) {
      return false // return false if not found
    } else {
      // rewire the next sibling's prevSibling to skip
      if (i < (children.length - 1)) { // there must be a next sibling
        children[i + 1].prevSibling = child.prevSibling
      }

      children.splice(i, 1) // remove node from the array

      // unwire child from the parent/siblings
      child.parent = null
      child.prevSibling = null

      this.descendantRemoved(child)

      return child // return on success (needed?)
    }
  }


  /*
  Removes all of the node's children from the hierarchy.
  */
  removeChildren() {
    for (let child of this.children) {
      this.descendantRemoved(child)
    }

    this.children = []
  }

  /*
  Removes this node from its parent
  */
  removeFromParentAndDom() {
    if (this.parent) {
      this.parent.removeChild(this)
    }

    if (this.get('isInDom')) {
      this.removeElement()
    }
  }

  /*
  Gets the last direct child node
  */
  getLastChild() {
    const { children } = this
    return children[children.length - 1]
  }

  /*
  Walks backward in the hierarchy to find the previous row leaf node.
  When looking at the hierarchy in a flat linear fashion, this is the revealed row just before the current.
  */
  getPrevRowInDom() {
    let node = this

    while (node) {
      if (node.prevSibling) {
        // attempt to go into the deepest last child of the previous sibling
        let lastChild
        node = node.prevSibling
        while ((lastChild = node.getLastChild())) {
          node = lastChild
        }
      } else {
        // otherwise, move up to the parent
        node = node.parent
      }

      // return this "previous" node if it has an exposed row
      if (node && node.get('isInDom') && node.hasOwnRow) {
        return node
      }
    }
    return null
  }

  /*
  Returns the first node in the subtree that has a revealed row
  */
  getLeadingRow() {
    if (this.hasOwnRow) {
      return this
    } else if (this.isExpanded && this.children.length) {
      return this.children[0].getLeadingRow()
    }
  }

  /*
  Generates a flat array containing all the row-nodes of the subtree. Descendants + self
  */
  getRows(batchArray = []) {

    if (this.hasOwnRow) {
      batchArray.push(this)
    }

    for (let child of this.children) {
      child.getRows(batchArray)
    }

    return batchArray
  }

  /*
  Generates a flat array containing all the nodes (row/non-row) of the subtree. Descendants + self
  */
  getNodes(batchArray = []) {
    batchArray.push(this)

    for (let child of this.children) {
      child.getNodes(batchArray)
    }

    return batchArray
  }

  /*
  Generates a flat array containing all the descendant nodes the current node
  */
  getDescendants() {
    const batchArray = []

    for (let child of this.children) {
      child.getNodes(batchArray)
    }

    return batchArray
  }


  // Rendering
  // ------------------------------------------------------------------------------------------------------------------


  show() {
    if (!this.get('isInDom')) {
      this.renderSkeleton()
    }
  }


  hide() {
    if (this.get('isInDom')) {
      this.removeElement()
    }
  }


  /*
  Builds and populates the TRs for each row type. Inserts them into the DOM.
  Does this only for this single row. Not recursive. If not a row (hasOwnRow=false), does not render anything.
  PRECONDITION: assumes the parent has already been rendered.
  */
  renderSkeleton() {
    this.trHash = {}
    const trNodes = []

    if (this.hasOwnRow) { // only bother rendering TRs if we know this node has a real row
      const prevRow = this.getPrevRowInDom() // the row before this row, in the overall linear flat list

      // let the view's tbody structure determine which TRs should be rendered
      for (let type in this.view.tbodyHash) {

        // build the TR and record it
        // assign before calling the render methods, because they might rely
        const tbody = this.view.tbodyHash[type]
        const tr = $('<tr/>')
        this.trHash[type] = tr
        trNodes.push(tr[0])

        // call the subclass' render method for this row type (if available)
        const renderMethodName = 'render' + capitaliseFirstLetter(type) + 'Skeleton'
        if (this[renderMethodName]) {
          this[renderMethodName](tr)
        }

        // insert the TR into the DOM
        if (prevRow) {
          prevRow.trHash[type].after(tr)
        } else {
          tbody.prepend(tr) // belongs in the very first position
        }
      }

      // build a single jQuery object. use event delegation for calling toggleExpanded
      this.trs = $(trNodes)
        .on('click', '.fc-expander', proxy(this, 'toggleExpanded'))

      this.thisRowShown()
    }

    this.set('isInDom', true)

    if (this.isExpanded) {
      for (let child of this.children) {
        child.renderSkeleton()
      }
    }
  }


  /*
  Unpopulates and removes all of this row's TRs from the DOM. Only for this single row. Not recursive.
  Will trigger "hidden".
  */
  removeElement() {
    // call the subclass' render method for each row type (if available)
    for (let type in this.trHash) {
      const tr = this.trHash[type]
      const unrenderMethodName = 'unrender' + capitaliseFirstLetter(type) + 'Skeleton'
      if (this[unrenderMethodName]) {
        this[unrenderMethodName](tr)
      }
    }

    this.unset('isInDom')
    this.thisRowHidden()

    this.trHash = {}
    this.trs.remove() // remove from DOM
    this.trs = $()

    for (let child of this.children) {
      if (child.get('isInDom')) {
        child.removeElement()
      }
    }
  }


  /*
  A simple getter for retrieving a TR jQuery object of a certain row type
  */
  getTr(type) {
    return this.trHash[type]
  }


  // Expanding / Collapsing
  // ------------------------------------------------------------------------------------------------------------------
  // Use by row groups and rows with subrows

  /*
  Reveals this node's children if they have not already been revealed. Changes any expander icon.
  */
  expand() {
    if (!this.isExpanded) {
      this.isExpanded = true

      this.indicateExpanded()

      for (let child of this.children) {
        child.show()
      }

      this.view.calendar.updateViewSize() // notify view of dimension change
      this.animateExpand()
    }
  }

  /*
  Hides this node's children if they are not already hidden. Changes any expander icon.
  */
  collapse() {
    if (this.isExpanded) {
      this.isExpanded = false

      this.indicateCollapsed()

      for (let child of this.children) {
        child.hide()
      }

      this.view.calendar.updateViewSize() // notify view of dimension change
    }
  }

  /*
  Switches between expanded/collapsed states
  */
  toggleExpanded() {
    if (this.isExpanded) {
      this.collapse()
    } else {
      this.expand()
    }
  }

  /*
  Changes the expander icon to the "expanded" state
  */
  indicateExpanded() {
    this.trs.find('.fc-expander .fc-icon')
      .removeClass(this.getCollapsedIcon())
      .addClass(this.getExpandedIcon())
  }

  /*
  Changes the expander icon to the "collapsed" state
  */
  indicateCollapsed() {
    this.trs.find('.fc-expander .fc-icon')
      .removeClass(this.getExpandedIcon())
      .addClass(this.getCollapsedIcon())
  }


  indicateExpandingEnabled() {
    this.trs.find('.fc-expander-space')
      .addClass('fc-expander')

    if (this.isExpanded) {
      this.indicateExpanded()
    } else {
      this.indicateCollapsed()
    }
  }


  indicateExpandingDisabled() {
    this.trs.find('.fc-expander-space')
      .removeClass('fc-expander')
      .find('.fc-icon')
        .removeClass(this.getExpandedIcon())
        .removeClass(this.getCollapsedIcon())
  }


  updateExpandingEnabled() {
    if (this.hasOwnRow && this.children.length) {
      this.indicateExpandingEnabled()
    } else {
      this.indicateExpandingDisabled()
    }
  }


  getExpandedIcon() {
    return 'fc-icon-down-triangle'
  }


  getCollapsedIcon() {
    const dir = this.view.isRTL ? 'left' : 'right'
    return 'fc-icon-' + dir + '-triangle'
  }


  /*
  Causes a slide-down CSS transition to demonstrate that the expand has happened
  */
  animateExpand() {
    const firstChild = this.children[0]
    const leadingRow = firstChild && firstChild.getLeadingRow()
    const trs = leadingRow && leadingRow.trs

    if (trs) {
      trs.addClass('fc-collapsed')

      setTimeout(() => { // wait for browser to render collapsed state
        trs.addClass('fc-transitioning') // enable transitioning
        trs.removeClass('fc-collapsed') // transition back to non-collapsed state
      })

      // cross-browser way to determine when the transition finishes
      trs.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', () => {
        trs.removeClass('fc-transitioning') // will remove the overflow:hidden
      })
    }
  }

  // Sizing
  // ------------------------------------------------------------------------------------------------------------------

  /*
  Find each TRs "inner div" (div within first cell). This div controls each TRs height.
  Returns the max pixel height.
  */
  getMaxTrInnerHeight() {
    let max = 0

    $.each(this.trHash, (type, tr) => {
      // exclude multi-rowspans (probably done for row grouping)
      const innerEl = getOwnCells(tr).find('> div:not(.fc-cell-content):first')
      max = Math.max(innerEl.height(), max)
    })

    return max
  }

  /*
  Find each TRs "inner div" and sets all of their heights to the same value.
  */
  setTrInnerHeight(height) {
    // exclude multi-rowspans (probably done for row grouping)
    $.each(this.trHash, (type, tr) => {
      getOwnCells(tr).find('> div:not(.fc-cell-content):first')
        .height(height)
    })
  }


  // Triggering
  // ------------------------------------------------------------------------------------------------------------------


  descendantAdded(row) {
    if (this.get('isInDom') && this.hasOwnRow && (this.children.length === 1)) {
      this.indicateExpandingEnabled()
    }

    (this.parent || this.view).descendantAdded(row)
  }


  descendantRemoved(row) {
    if (this.get('isInDom') && this.hasOwnRow && (this.children.length === 0)) {
      this.indicateExpandingDisabled()
    }

    (this.parent || this.view).descendantRemoved(row)
  }


  thisRowShown() {
    (this.parent || this.view).descendantShown(this)
  }


  thisRowHidden() {
    (this.parent || this.view).descendantHidden(this)
  }


  descendantShown(row) {
    (this.parent || this.view).descendantShown(row)
  }


  descendantHidden(row) {
    (this.parent || this.view).descendantHidden(row)
  }

}

RowParent.prototype.hasOwnRow = false
