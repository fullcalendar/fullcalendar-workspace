import { DateMarker, DateProfile, NowIndicatorLineContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from "./util.js"

export interface TimeGridNowIndicatorLineProps {
  nowDate: DateMarker
  dayDate: DateMarker
  dateProfile: DateProfile
  totalHeight: number | undefined
}

export function TimeGridNowIndicatorLine(props: TimeGridNowIndicatorLineProps) {
  return (
    <div className="fc-timegrid-now-indicator-container">
      <NowIndicatorLineContainer
        className='fc-timegrid-now-indicator-line'
        style={{
          top: props.totalHeight != null
            ? props.totalHeight * computeDateTopFrac(props.nowDate, props.dateProfile, props.dayDate)
            : undefined
        }}
        date={props.nowDate}
      />
    </div>
  )
}
