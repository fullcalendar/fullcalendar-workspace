import { DateMarker, DateProfile, fracToCssDim, NowIndicatorContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from "./util.js"

export interface TimeGridNowIndicatorArrowProps {
  nowDate: DateMarker
  dateProfile: DateProfile
}

export function TimeGridNowIndicatorArrow(props: TimeGridNowIndicatorArrowProps) {
  return (
    <NowIndicatorContainer
      className='fc-timegrid-now-indicator-arrow'
      style={{
        top: fracToCssDim(computeDateTopFrac(props.nowDate, props.dateProfile))
      }}
      isAxis
      date={props.nowDate}
    />
  )
}
