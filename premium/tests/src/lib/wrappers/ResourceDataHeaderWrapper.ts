import { findElements } from '@fullcalendar/core/internal'

export class ResourceDataHeaderWrapper {
  constructor(private el: HTMLElement) {
  }

  getCellEls() {
    return findElements(this.el, '.fcnew-cell')
  }

  getColResizerEls() {
    return findElements(this.el, '.fcnew-datagrid-col-resizer')
  }
}
