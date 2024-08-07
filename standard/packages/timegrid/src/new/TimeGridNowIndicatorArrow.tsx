import { DateMarker, NowIndicatorContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { CssDimValue } from "@fullcalendar/core"

/*
TODO: accept top coord
*/
export interface TimeGridNowIndicatorArrowProps {
  nowDate: DateMarker
  top: CssDimValue
}

export function TimeGridNowIndicatorArrow(props: TimeGridNowIndicatorArrowProps) {
  return (
    <div>
      <NowIndicatorContainer
        elClasses={['fcnew-timegrid-now-indicator-arrow']}
        elStyle={{ top: props.top }}
        isAxis
        date={props.nowDate}
      />
    </div>
  )
}
