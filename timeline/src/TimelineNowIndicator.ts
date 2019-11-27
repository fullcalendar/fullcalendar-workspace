import { removeElement, SubRenderer, ComponentContext, applyStyle, DateMarker, subrenderer, rangeContainsMarker, greatestDurationDenominator } from '@fullcalendar/core'
import TimelineSlats from './TimelineSlats'
import { TimelineDateProfile } from './timeline-date-profile'

export interface TimelineNowIndicatorProps {
  headParentEl: HTMLElement
  bodyParentEl: HTMLElement
  tDateProfile: TimelineDateProfile
  date: DateMarker
  slats: TimelineSlats
}

export default class TimelineNowIndicator extends SubRenderer<TimelineNowIndicatorProps> {

  private renderMarkers = subrenderer(renderMarkers, unrenderMarkers)
  private updateMarkerCoords = subrenderer(updateMarkerCoords)


  render(props: TimelineNowIndicatorProps) {

    if (rangeContainsMarker(props.tDateProfile.normalizedRange, props.date)) {
      let { arrowEl, lineEl } = this.renderMarkers({
        headParentEl: props.headParentEl,
        bodyParentEl: props.bodyParentEl
      })

      this.updateMarkerCoords({
        arrowEl,
        lineEl,
        slats: props.slats,
        date: props.date
      })

    } else {
      this.renderMarkers(false)
    }
  }

}


function renderMarkers(props: { headParentEl: HTMLElement, bodyParentEl: HTMLElement }) {
  let arrowEl = document.createElement('div')
  arrowEl.className = 'fc-now-indicator fc-now-indicator-arrow'

  let lineEl = document.createElement('div')
  lineEl.className = 'fc-now-indicator fc-now-indicator-line'

  props.headParentEl.appendChild(arrowEl)
  props.bodyParentEl.appendChild(lineEl)

  return { arrowEl, lineEl }
}


function unrenderMarkers(props: { arrowEl: HTMLElement, lineEl: HTMLElement }) {
  removeElement(props.arrowEl)
  removeElement(props.lineEl)
}


function updateMarkerCoords(props: { arrowEl: HTMLElement, lineEl: HTMLElement, slats: TimelineSlats, date: DateMarker }, context: ComponentContext) {
  let coord = props.slats.dateToCoord(props.date)
  let styleProps = context.isRtl ? { right: -coord } : { left: coord }

  applyStyle(props.arrowEl, styleProps)
  applyStyle(props.lineEl, styleProps)
}


export function getTimelineNowIndicatorUnit(tDateProfile: TimelineDateProfile) {
  if (tDateProfile.isTimeScale) {
    return greatestDurationDenominator(tDateProfile.slotDuration).unit
  }
}
