import { removeElement, createElement } from '@fullcalendar/core'

export default class TimelineNowIndicator {

  headParent: HTMLElement
  bodyParent: HTMLElement
  arrowEl: HTMLElement
  lineEl: HTMLElement

  constructor(headParent: HTMLElement, bodyParent: HTMLElement) {
    this.headParent = headParent
    this.bodyParent = bodyParent
  }

  render(coord: number, isRtl: boolean) {
    let styleProps = isRtl ? { right: -coord } : { left: coord }

    this.headParent.appendChild(
      this.arrowEl = createElement('div', {
        className: 'fc-now-indicator fc-now-indicator-arrow',
        style: styleProps
      })
    )

    this.bodyParent.appendChild(
      this.lineEl = createElement('div', {
        className: 'fc-now-indicator fc-now-indicator-line',
        style: styleProps
      })
    )
  }

  unrender() {
    if (this.arrowEl) {
      removeElement(this.arrowEl)
    }

    if (this.lineEl) {
      removeElement(this.lineEl)
    }
  }

}
