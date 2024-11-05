import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'

export class ResourceDataHeaderWrapper {
  constructor(private el: HTMLElement) {
  }

  getCellEls() {
    return findElements(this.el, '[role=gridcell]')
  }

  getColResizerEls() {
    return findElements(this.el, '.fc-datagrid-col-resizer')
  }
}
