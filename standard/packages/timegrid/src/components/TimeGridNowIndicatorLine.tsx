import { DateMarker, DateProfile, fracToCssDim, NowIndicatorContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from "./util.js"

export interface TimeGridNowIndicatorLineProps {
  nowDate: DateMarker
  dayDate: DateMarker
  dateProfile: DateProfile
}

export function TimeGridNowIndicatorLine(props: TimeGridNowIndicatorLineProps) {
  return (
    <div className="fcnew-timegrid-now-indicator-container">
      <NowIndicatorContainer
        elClasses={['fcnew-timegrid-now-indicator-line']}
        elStyle={{
          top: fracToCssDim(computeDateTopFrac(props.nowDate, props.dateProfile, props.dayDate))
        }}
        isAxis={false}
        date={props.nowDate}
      />
    </div>
  )
}
