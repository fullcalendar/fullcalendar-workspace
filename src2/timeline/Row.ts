import { removeElement } from 'fullcalendar'
import SimpleComponent from './SimpleComponent'

export default abstract class Row extends SimpleComponent {

  spreadsheetTr: HTMLElement
  timeAxisTr: HTMLElement

  setParents(
    spreadsheetParent,
    spreadsheetNextSibling,
    timeAxisParent,
    timeAxisNextSibling
  ) {
    spreadsheetParent.insertBefore(
      this.spreadsheetTr = document.createElement('tr'),
      spreadsheetNextSibling
    )

    timeAxisParent.insertBefore(
      this.timeAxisTr = document.createElement('tr'),
      timeAxisNextSibling
    )
  }

  removeElement() {
    removeElement(this.spreadsheetTr)
    removeElement(this.timeAxisTr)
  }

  abstract getHeightEls(): HTMLElement[]

  updateSize(forceFlags) {
  }

}
