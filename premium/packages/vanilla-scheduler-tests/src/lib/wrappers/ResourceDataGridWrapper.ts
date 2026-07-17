import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'

export class ResourceDataGridWrapper {
  constructor(private el: HTMLElement) {
  }

  getRootEl() {
    return this.el
  }

  /*
  Must have positioning determined first
  */
  getRowInfo() {
    let rowHeaderEls = findElements(this.el, '[role=rowheader]')
    let infos = []

    for (let rowHeaderEl of rowHeaderEls) {
      const rowEl = rowHeaderEl.parentElement as HTMLElement
      let theInfo

      if (rowHeaderEl.classList.contains('fc-resource')) {
        theInfo = buildResourceInfoFromRow(rowEl)
      } else if (rowHeaderEl.classList.contains('fc-resource-group')) {
        theInfo = buildGroupInfoFromRow(rowEl)
      }

      if (theInfo) {
        theInfo.top = rowEl.getBoundingClientRect().top
        infos.push(theInfo)
      }
    }

    infos.sort((a, b) => {
      return a.top - b.top
    })

    return infos
  }

  getResourceInfo() {
    return this.getRowInfo().filter((rowInfo) => rowInfo.type === 'resource')
  }

  getResourceIds() {
    return this.getResourceInfo().map((info) => info.resourceId)
  }

  getSpecificResourceInfo(resourceId) {
    let cellEl = this.getResourceCellEl(resourceId)

    if (cellEl) {
      return buildResourceInfoFromRow(cellEl)
    }

    return null
  }

  getResourceCellEl(resourceId) {
    return this.el.querySelector(`.fc-cell.fc-resource[data-resource-id="${resourceId}"]`) as HTMLElement
  }

  getResourceCellEls(resourceId) {
    let selector = '.fc-cell.fc-resource'

    if (resourceId) {
      selector += `[data-resource-id="${resourceId}"]`
    } else {
      selector += '[data-resource-id]'
    }

    return findElements(this.el, selector)
  }

  getAllRows() {
    return findElements(this.el, '[role=rowheader]')
      .filter((rowHeaderEl) => (
        rowHeaderEl.classList.contains('fc-resource') ||
        rowHeaderEl.classList.contains('fc-resource-group')
      ))
      .map((rowHeaderEl) => rowHeaderEl.parentElement as HTMLElement)
  }

  clickFirstExpander() {
    $(this.el.querySelector('.fc-resource-expander')).simulate('click')
  }

  clickExpander(resourceId) {
    $(this.getExpanderEl(resourceId)).simulate('click')
  }

  getExpanderEl(resourceId) {
    return this.getResourceCellEl(resourceId).querySelector('.fc-resource-expander')
  }

  isRowExpanded(resourceId) {
    let iconEl = this.getExpanderEl(resourceId)

    if (iconEl.classList.contains('fc-resource-expander-collapsed')) {
      return false
    }

    if (iconEl.classList.contains('fc-resource-expander-expanded')) {
      return true
    }

    throw new Error('Resource row is neither expanded or contracted.')
  }

  getRowIndentationWidth(resourceId) {
    return this.getResourceCellEl(resourceId).querySelector('.fc-resource-indent').getBoundingClientRect().width
  }
}

function buildResourceInfoFromRow(rowEl) {
  const cellEl = rowEl.firstElementChild
  return {
    type: 'resource',
    resourceId: cellEl.getAttribute('data-resource-id'),
    text: $(cellEl.querySelector('.fc-cell-main')).text(),
    cellEl,
    rowEl,
  }
}

function buildGroupInfoFromRow(rowEl) {
  const cellEl = rowEl.firstElementChild
  return {
    type: 'group',
    text: $(cellEl.querySelector('.fc-resource-group-inner')).text(),
    cellEl,
    rowEl,
  }
}
