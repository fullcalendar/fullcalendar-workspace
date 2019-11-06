import { removeElement, createElement, Component, ComponentContext, applyStyle } from '@fullcalendar/core'

export interface TimelineNowIndicatorProps {
  headParent: HTMLElement
  bodyParent: HTMLElement
}

export default class TimelineNowIndicator extends Component<TimelineNowIndicatorProps, ComponentContext> {

  arrowEl: HTMLElement
  lineEl: HTMLElement


  render(props: TimelineNowIndicatorProps, context: ComponentContext) {

    props.headParent.appendChild(
      this.arrowEl = createElement('div', {
        className: 'fc-now-indicator fc-now-indicator-arrow'
      })
    )

    props.bodyParent.appendChild(
      this.lineEl = createElement('div', {
        className: 'fc-now-indicator fc-now-indicator-line'
      })
    )
  }


  unrender() {
    removeElement(this.arrowEl)
    removeElement(this.lineEl)
  }


  updateCoord(coord: number) {
    let styleProps = this.context.isRtl ? { right: -coord } : { left: coord }

    applyStyle(this.arrowEl, styleProps)
    applyStyle(this.lineEl, styleProps)
  }

}
