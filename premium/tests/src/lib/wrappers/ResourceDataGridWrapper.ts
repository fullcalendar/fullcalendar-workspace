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
    let rowEls = findElements(this.el, '[role=row]')
    let infos = []

    for (let rowEl of rowEls) {
      let theInfo

      if (rowEl.querySelector('.fc-resource')) {
        theInfo = buildResourceInfoFromRow(rowEl)
      } else if (rowEl.querySelector('.fc-resource-group')) {
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
    return this.el.querySelector(`[role=row][data-resource-id="${resourceId}"] > *`) as HTMLElement
  }

  getResourceCellEls(resourceId) {
    let selector = '[role=row].fc-resource'

    if (resourceId) {
      selector += `[data-resource-id="${resourceId}"]`
    } else {
      selector += '[data-resource-id]'
    }

    selector += ' > *'

    return findElements(this.el, selector)
  }

  getAllRows() {
    return findElements(this.el, '[role=row]')
  }

  clickFirstExpander() {
    $(this.el.querySelector('.fc-datagrid-expander')).simulate('click')
  }

  clickExpander(resourceId) {
    $(this.getExpanderEl(resourceId)).simulate('click')
  }

  getExpanderEl(resourceId) {
    return this.getResourceCellEl(resourceId).querySelector('.fc-datagrid-expander')
  }

  isRowExpanded(resourceId) {
    let iconEl = this.getExpanderEl(resourceId)

    if (iconEl.classList.contains('fc-icon-plus-square')) {
      return false
    }

    if (iconEl.classList.contains('fc-icon-minus-square')) {
      return true
    }

    throw new Error('Resource row is neither expanded or contracted.')
  }

  getRowIndentation(resourceId) {
    return this.getResourceCellEl(resourceId).querySelectorAll('.fc-icon').length
  }
}

function buildResourceInfoFromRow(rowEl) {
  const cellEl = rowEl.firstElementChild
  return {
    type: 'resource',
    resourceId: rowEl.getAttribute('data-resource-id'),
    text: $(rowEl.querySelector('.fc-cell-main')).text(),
    cellEl,
    rowEl,
  }
}

function buildGroupInfoFromRow(rowEl) {
  const cellEl = rowEl.firstElementChild
  return {
    type: 'group',
    text: $(cellEl.querySelector('.fc-cell-main')).text(),
    cellEl,
    rowEl,
  }
}
