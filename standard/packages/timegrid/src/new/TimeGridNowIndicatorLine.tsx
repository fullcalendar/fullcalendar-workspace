import { DateMarker, NowIndicatorContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { CssDimValue } from "@fullcalendar/core"

/*
TODO: accept top coord
*/
export interface TimeGridNowIndicatorLineProps {
  nowDate: DateMarker
  top: CssDimValue
}

export function TimeGridNowIndicatorLine(props: TimeGridNowIndicatorLineProps) {
  return (
    <div>
      <NowIndicatorContainer
        elClasses={['fcnew-timegrid-now-indicator-line']}
        elStyle={{ top: props.top }}
        isAxis={false}
        date={props.nowDate}
      />
    </div>
  )
}
