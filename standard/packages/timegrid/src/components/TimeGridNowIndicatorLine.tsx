import { DateMarker, DateProfile, NowIndicatorLineContainer, joinClassNames } from "@fullcalendar/core/internal"
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from "./util.js"

export interface TimeGridNowIndicatorLineProps {
  nowDate: DateMarker
  dayDate: DateMarker
  dateProfile: DateProfile
  totalHeight: number | undefined
}

/*
TODO: DRY with other NowIndicator components
*/
export function TimeGridNowIndicatorLine(props: TimeGridNowIndicatorLineProps) {
  return (
    <div
      // crop any overflow that the arrow/line might cause
      // TODO: just do this on the entire canvas within the scroller
      className={joinClassNames(classNames.fill, classNames.crop)}
      style={{
        zIndex: 2, // inlined from $now-indicator-z
        pointerEvents: 'none', // TODO: className
      }}
    >
      <NowIndicatorLineContainer
        className={classNames.fillX}
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
