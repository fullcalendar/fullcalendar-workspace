import { findElements } from '@fullcalendar/core'

export default class ResourceDataGridWrapper {

  constructor(private el: HTMLElement) {
  }


  getRowInfo() {
    return findElements(this.el, 'tr').map((tr) => buildInfoForRowEl(tr))
  }


  getSpecificRowInfo(resourceId) {
    return buildInfoForRowEl(this.getResourceRowEl(resourceId))
  }


  getResourceIds() {
    return this.getResourceRowEls().map((rowEl) => (
      rowEl.getAttribute('data-resource-id')
    ))
  }


  getResourceInfo() {
    return this.getResourceRowEls().map((rowEl) => ({
      id: rowEl.getAttribute('data-resource-id'),
      title: $(rowEl).find('.fc-cell-text').text()
    }))
  }


  getResourceRowEl(resourceId) {
    return this.el.querySelector(`tr[data-resource-id="${resourceId}"]`) as HTMLElement
  }


  getResourceRowEls() {
    return findElements(this.el, 'tr[data-resource-id]')
  }


  clickFirstExpander() {
    $(this.el.querySelector('.fc-expander')).simulate('click')
  }


  clickExpander(resourceId) {
    $(this.getExpanderEl(resourceId)).simulate('click')
  }


  getExpanderEl(resourceId) {
    return this.el.querySelector(`tr[data-resource-id="${resourceId}"] .fc-expander`)
  }


  isRowExpanded(resourceId) {
    let iconEl = this.getExpanderEl(resourceId).querySelector('.fc-icon')

    if (iconEl.classList.contains('fc-icon-plus-square')) {
      return false
    } else if (iconEl.classList.contains('fc-icon-minus-square')) {
      return true
    } else {
      throw new Error('Resource row is neither expanded or contracted.')
    }
  }


  getRowIndentation(resourceId) {
    return this.getResourceRowEl(resourceId).querySelectorAll('.fc-icon').length
  }


  getRowCellEls(resourceId) {
    return findElements(this.getResourceRowEl(resourceId), 'td')
  }

}


function buildInfoForRowEl(tr) {
  let $tr = $(tr)
  let resourceId = tr.getAttribute('data-resource-id')
  let text = $tr.find('.fc-cell-text').text()

  if (resourceId) {
    return {
      type: 'resource',
      resourceId,
      text
    }
  } else if ($tr.find('.fc-divider').length) {
    return {
      type: 'divider',
      text
    }
  } else {
    return {}
  }
}
