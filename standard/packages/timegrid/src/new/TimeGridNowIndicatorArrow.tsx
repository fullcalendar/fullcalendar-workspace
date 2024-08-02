import { DateMarker, NowIndicatorContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'

/*
TODO: accept top coord
*/
export interface TimeGridNowIndicatorArrowProps {
  nowDate: DateMarker
}

export function TimeGridNowIndicatorArrow(props: TimeGridNowIndicatorArrowProps) {
  return (
    <div>
      <NowIndicatorContainer
        elClasses={['fcnew-timegrid-now-indicator-arrow']}
        elStyle={{ top: undefined }}
        isAxis
        date={props.nowDate}
      />
    </div>
  )
}
