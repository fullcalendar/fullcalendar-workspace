import { DateMarker, DateProfile, NowIndicatorContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from "./util.js"

export interface TimeGridNowIndicatorArrowProps {
  nowDate: DateMarker
  dateProfile: DateProfile
  totalHeight: number | undefined
}

export function TimeGridNowIndicatorArrow(props: TimeGridNowIndicatorArrowProps) {
  return (
    <NowIndicatorContainer
      className='fc-timegrid-now-indicator-arrow'
      style={{
        top: props.totalHeight != null
          ? props.totalHeight * computeDateTopFrac(props.nowDate, props.dateProfile)
          : undefined
      }}
      isAxis
      date={props.nowDate}
    />
  )
}
