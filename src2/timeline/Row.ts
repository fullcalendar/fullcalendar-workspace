import { removeElement } from 'fullcalendar'
import SimpleComponent from './SimpleComponent'

export default abstract class Row extends SimpleComponent {

  spreadsheetTr: HTMLElement
  timeAxisTr: HTMLElement

  setParents(
    spreadsheetParent,
    spreadsheetNextSibling,
    timeAxisParent,
    timeAxisNextSibling,
    timeAxis
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

  removeElements() {
    removeElement(this.spreadsheetTr)
    removeElement(this.timeAxisTr)
  }

  abstract getHeightEls(): HTMLElement[]

  updateSize(totalHeight, isAuto, force) {
  }

}
