import { findElements } from '@fullcalendar/core'

export default class ResourceDataGridWrapper {

  constructor(private el: HTMLElement) {
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
    return this.el.querySelector(`tr[data-resource-id="${resourceId}"]`)
  }


  getResourceRowEls() {
    return findElements(this.el, 'tr[data-resource-id]')
  }

}
