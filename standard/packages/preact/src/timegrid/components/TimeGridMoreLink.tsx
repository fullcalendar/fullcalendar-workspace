import { CssDimValue } from '../../scrollgrid/util'
import { joinClassNames } from '../../util/html'
import { MoreLinkContainer } from '../../more-link/MoreLinkContainer'
import { memo } from 'react'
import { Dictionary } from '../../util/object'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { DateRange, DateMarker } from '@full-ui/headless-calendar'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { EventRangeProps } from '../../event-segs/event-ranges'
import classNames from '../../styles.module.css'
import { renderPlainFgSegs } from './TimeGridCol' // BAD
import { TimeGridRange } from '../../day-table/time-grid-range'

export interface TimeGridMoreLinkProps {
  hiddenSegs: (TimeGridRange & EventRangeProps)[]
  top: CssDimValue
  height: CssDimValue
  dateSpanProps?: Dictionary
  renderProps?: Dictionary // so can include a resource
  dateProfile: DateProfile
  todayRange: DateRange
  nowDate: DateMarker
  nowMs?: number
  eventSelection: string
  eventDrag: EventSegUiInteractionState<TimeGridRange>
  eventResize: EventSegUiInteractionState<TimeGridRange>
  isNarrow: boolean
  isMicro: boolean
}

export const TimeGridMoreLink = memo(function TimeGridMoreLink(props: TimeGridMoreLinkProps) {
  return (
    <div // the "harness"
      role='listitem'
      className={joinClassNames(
        classNames.abs,
        classNames.flexCol,
        classNames.end0,
        classNames.z9999,
      )}
      style={{
        top: props.top,
        height: props.height,
      }}
    >
      <MoreLinkContainer
        className={classNames.liquid}
        display='column'
        allDayDate={null}
        segs={props.hiddenSegs}
        hiddenSegs={props.hiddenSegs}
        dateSpanProps={props.dateSpanProps}
        renderProps={props.renderProps}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        popoverContent={() => renderPlainFgSegs(props.hiddenSegs, props, /* isMirror = */ false)}
        forceTimed={true}
        isNarrow={props.isNarrow}
        isMicro={props.isMicro}
      />
    </div>
  )
})
