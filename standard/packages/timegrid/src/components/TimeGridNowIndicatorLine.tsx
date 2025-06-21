import { DateMarker, DateProfile, joinClassNames, NowIndicatorDot, NowIndicatorLineContainer } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'
import { computeDateTopFrac } from './util.js'

export interface TimeGridNowIndicatorLineProps {
  nowDate: DateMarker
  dayDate: DateMarker
  dateProfile: DateProfile
  totalHeight: number | undefined
}

/*
Renders both the line AND the dot
TODO: DRY with other NowIndicator components
*/
export function TimeGridNowIndicatorLine(props: TimeGridNowIndicatorLineProps) {
  const top = props.totalHeight != null
    ? props.totalHeight * computeDateTopFrac(props.nowDate, props.dateProfile, props.dayDate)
    : undefined

  return (
    <div
      className={classNames.fill}
      style={{
        zIndex: 2, // inlined from $now-indicator-z
        pointerEvents: 'none', // TODO: className
      }}
    >
      <NowIndicatorLineContainer
        className={joinClassNames(
          classNames.fillX,
          classNames.noMarginX,
          classNames.borderlessX,
        )}
        style={{ top }}
        date={props.nowDate}
      />
      <NowIndicatorDot
        className={joinClassNames(classNames.abs, classNames.start0)}
        style={{ top }}
      />
    </div>
  )
}
