import { removeElement, Component, ComponentContext } from '@fullcalendar/core'

export default abstract class Row<PropsType> extends Component<PropsType> {

  spreadsheetTr: HTMLElement
  timeAxisTr: HTMLElement

  isSizeDirty: boolean = false

  constructor(
    context: ComponentContext,
    spreadsheetParent: HTMLElement,
    spreadsheetNextSibling: HTMLElement,
    timeAxisParent: HTMLElement,
    timeAxisNextSibling: HTMLElement
  ) {
    super(context)

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

  updateSize(isResize: boolean) {
    this.isSizeDirty = false
  }

}
