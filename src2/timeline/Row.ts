import { View, removeElement } from 'fullcalendar'
import SimpleComponent from './SimpleComponent'

export default abstract class Row<PropsType> extends SimpleComponent<PropsType> {

  spreadsheetTr: HTMLElement
  timeAxisTr: HTMLElement

  constructor(
    view: View,
    spreadsheetParent: HTMLElement,
    spreadsheetNextSibling: HTMLElement,
    timeAxisParent: HTMLElement,
    timeAxisNextSibling: HTMLElement
  ) {
    super(view)

    spreadsheetParent.insertBefore(
      this.spreadsheetTr = document.createElement('tr'),
      spreadsheetNextSibling
    )

    timeAxisParent.insertBefore(
      this.timeAxisTr = document.createElement('tr'),
      timeAxisNextSibling
    )
  }

  destroy() {
    removeElement(this.spreadsheetTr)
    removeElement(this.timeAxisTr)

    super.destroy()
  }

  abstract getHeightEls(): HTMLElement[]

}
