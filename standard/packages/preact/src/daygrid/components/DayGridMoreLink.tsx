import { MoreLinkContainer } from '../../more-link/MoreLinkContainer'
import { DateMarker, DateRange } from '@full-ui/headless-calendar'
import { Dictionary } from '../../util/object'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { getEventRangeMeta } from '../../event-segs/event-rendering'
import { SlicedCoordRange } from '../../event-segs/coord-range'
import { ForegroundEvent, listItemEventVariant, rowEventVariant } from '../../events/components/ForegroundEvent'
import { memo, type RefObject } from 'react'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT, hasListItemDisplay } from '../event-display'
import { DayRowEventRange, DayRowEventRangePart } from '../day-row-range'
import { DAY_GRID_CELL_CONTENT_Z_CLASS } from './z-index'
import { joinClassNames } from '../../util/html'

export interface DayGridMoreLinkProps {
  className?: string
  allDayDate: DateMarker
  segs: DayRowEventRangePart[]
  hiddenSegs: DayRowEventRange[]
  alignElRef: RefObject<HTMLElement>
  alignParentTop: string // for popover
  dateSpanProps?: Dictionary
  renderProps?: Dictionary // so can include a resource
  dateProfile: DateProfile
  todayRange: DateRange
  eventSelection: string
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null
  isNarrow: boolean
  isMicro: boolean
}

export const DayGridMoreLink = memo(function DayGridMoreLink(props: DayGridMoreLinkProps) {
  return (
    <MoreLinkContainer
      display='row'
      className={joinClassNames(props.className, DAY_GRID_CELL_CONTENT_Z_CLASS)}
      isNarrow={props.isNarrow}
      isMicro={props.isMicro}
      dateProfile={props.dateProfile}
      todayRange={props.todayRange}
      allDayDate={props.allDayDate}
      segs={props.segs}
      hiddenSegs={props.hiddenSegs}
      alignElRef={props.alignElRef}
      alignParentTop={props.alignParentTop}
      dateSpanProps={props.dateSpanProps}
      renderProps={props.renderProps}
      popoverContent={() => (
        <>
          {props.segs.map((seg) => {
            let { eventRange } = seg
            let { instanceId } = eventRange.instance
            let isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
            let isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
            let isInvisible = isDragging || isResizing

            return (
              <div
                key={instanceId}
                role='listitem'
                style={{
                  visibility: isInvisible ? 'hidden' : undefined,
                }}
              >
                <ForegroundEvent
                  variant={hasListItemDisplay(seg, eventRange) ? listItemEventVariant : rowEventVariant}
                  eventRange={eventRange}
                  isStart={seg.isStart}
                  isEnd={seg.isEnd}
                  isDragging={isDragging}
                  isResizing={isResizing}
                  isMirror={false}
                  isSelected={instanceId === props.eventSelection}
                  defaultTimeFormat={DEFAULT_TABLE_EVENT_TIME_FORMAT}
                  defaultDisplayEventEnd={false}
                  renderProps={props.renderProps}
                  {...getEventRangeMeta(eventRange, props.todayRange)}
                />
              </div>
            )
          })}
        </>
      )}
    />
  )
})
