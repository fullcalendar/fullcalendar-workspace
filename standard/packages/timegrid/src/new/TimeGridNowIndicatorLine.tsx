import { DateMarker, NowIndicatorContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'

/*
TODO: accept top coord
*/
export interface TimeGridNowIndicatorLineProps {
  nowDate: DateMarker
}

export function TimeGridNowIndicatorLine(props: TimeGridNowIndicatorLineProps) {
  return (
    <div>
      <NowIndicatorContainer
        elClasses={['fcnew-timegrid-now-indicator-line']}
        elStyle={{ top: undefined }}
        isAxis={false}
        date={props.nowDate}
      />
    </div>
  )
}
