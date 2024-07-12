import { DateMarker, NowIndicatorContainer } from "@fullcalendar/core/internal";
import { createElement } from '@fullcalendar/core/preact'

export interface TimeGridNowIndicatorProps {
  nowDate: DateMarker
}

export function TimeGridNowIndicator(props: TimeGridNowIndicatorProps) {
  return (
    <div>
      <NowIndicatorContainer
        elClasses={['fc-timegrid-now-indicator-arrow']}
        elStyle={{ top: undefined }}
        isAxis
        date={props.nowDate}
      />
    </div>
  )
}
