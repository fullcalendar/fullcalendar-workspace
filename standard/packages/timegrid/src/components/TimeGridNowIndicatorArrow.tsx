import { DateMarker, DateProfile, NowIndicatorLabelContainer } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from "./util.js"

export interface TimeGridNowIndicatorArrowProps {
  nowDate: DateMarker
  dateProfile: DateProfile
  totalHeight: number | undefined
}

/*
TODO: DRY with other NowIndicator components
*/
export function TimeGridNowIndicatorArrow(props: TimeGridNowIndicatorArrowProps) {
  return (
    <div
      // crop any overflow that the arrow/line might cause
      // TODO: just do this on the entire canvas within the scroller
      className="fcu-fill fcu-crop"
      style={{
        zIndex: 2, // inlined from $now-indicator-z
        pointerEvents: 'none', // TODO: className
      }}
    >
      <NowIndicatorLabelContainer
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
