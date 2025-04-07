import { DateMarker, DateProfile, NowIndicatorLabelContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from "./util.js"

export interface TimeGridNowIndicatorArrowProps {
  nowDate: DateMarker
  dateProfile: DateProfile
  totalHeight: number | undefined
}

export function TimeGridNowIndicatorArrow(props: TimeGridNowIndicatorArrowProps) {
  return (
    <div className="fc-timegrid-now-indicator-container">
      <NowIndicatorLabelContainer
        className='fc-timegrid-now-indicator-arrow'
        style={{
          top: props.totalHeight != null
            ? props.totalHeight * computeDateTopFrac(props.nowDate, props.dateProfile)
            : undefined
        }}
        date={props.nowDate}
      />
    </div>
  )
}
