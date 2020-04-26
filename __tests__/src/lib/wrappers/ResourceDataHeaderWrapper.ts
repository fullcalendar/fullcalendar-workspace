import { findElements } from '@fullcalendar/preact';

export class ResourceDataHeaderWrapper {

  constructor(private el: HTMLElement) {
  }


  getCellEls() {
    return findElements(this.el, 'th')
  }


  getColResizerEls() {
    return findElements(this.el, '.fc-datagrid-cell-resizer')
  }

}
