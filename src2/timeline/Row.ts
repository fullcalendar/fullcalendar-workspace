import { removeElement } from 'fullcalendar'

export default class Row {

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

  updateSize(totalHeight, isAuto, forceFlags) {
    // TODO: sychronize heights between spreadsheetTr and timeAxisTr
  }

}
