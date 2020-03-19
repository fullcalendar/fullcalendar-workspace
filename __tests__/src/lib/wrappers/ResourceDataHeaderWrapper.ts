import { findElements } from '@fullcalendar/core';

export default class ResourceDataHeaderWrapper {

  constructor(private el: HTMLElement) {
  }


  getCellEls() {
    return findElements(this.el, 'th')
  }


  getColResizerEls() {
    return findElements(this.el, '.fc-datagrid-header-resizer')
  }

}
