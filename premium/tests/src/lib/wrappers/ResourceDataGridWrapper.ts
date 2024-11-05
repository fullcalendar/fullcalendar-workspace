import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'

export class ResourceDataGridWrapper {
  constructor(private el: HTMLElement) {
  }

  getRootEl() {
    return this.el
  }

  getRowInfo() {
    let trs = findElements(this.el, '[role=row]')
    let infos = []

    for (let tr of trs) {
      if (tr.classList.contains('fc-resource')) {
        infos.push(buildResourceInfoFromCell(tr.firstElementChild))
      } else if (tr.classList.contains('fc-resource-group')) {
        infos.push(buildGroupInfoFromCell(tr.firstElementChild))
      }
    }

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
      return buildResourceInfoFromCell(cellEl)
    }

    return null
  }

  getResourceCellEl(resourceId) {
    return this.el.querySelector(`[role=gridcell][data-resource-id="${resourceId}"]`) as HTMLElement
  }

  getResourceCellEls(resourceId) {
    let selector = '[role=gridcell].fc-resource'

    if (resourceId) {
      selector += `[data-resource-id="${resourceId}"]`
    }

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
    let iconEl = this.getExpanderEl(resourceId).querySelector('.fc-icon')

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

function buildResourceInfoFromCell(cellEl) {
  return {
    type: 'resource',
    resourceId: cellEl.getAttribute('data-resource-id'),
    text: $(cellEl.querySelector('.fc-cell-main')).text(),
    cellEl,
    rowEl: cellEl.parentNode,
  }
}

function buildGroupInfoFromCell(cellEl) {
  return {
    type: 'group',
    text: $(cellEl.querySelector('.fc-cell-main')).text(),
    cellEl,
    rowEl: cellEl.parentNode,
  }
}
