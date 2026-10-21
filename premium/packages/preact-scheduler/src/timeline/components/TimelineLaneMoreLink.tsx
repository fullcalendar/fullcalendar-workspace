import { memo } from 'react'
import {
  DateMarker, DateProfile, DateRange, Dictionary, EventRangeProps, SlicedEventInteraction, getEventRangeMeta, MoreLinkContainer
} from '@fullcalendar/preact/protected-api'
import { TimelineRange } from '../TimelineLaneSlicer'
import { TimelineEvent } from './TimelineEvent'

export interface TimelineLaneMoreLinkProps {
  dateProfile: DateProfile
  isTimeScale: boolean
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange

  // content
  hiddenSegs: (TimelineRange & EventRangeProps)[]
  eventDrag: SlicedEventInteraction<TimelineRange> | null
  eventResize: SlicedEventInteraction<TimelineRange> | null
  eventSelection: string
  dateSpanProps?: Dictionary // so can include a resource
  renderProps?: Dictionary // so can include a resource
}

export const TimelineLaneMoreLink = memo(function TimelineLaneMoreLink(props: TimelineLaneMoreLinkProps) {
  let { hiddenSegs } = props

  return (
    <MoreLinkContainer
      display='row'
      allDayDate={null}
      segs={hiddenSegs}
      hiddenSegs={hiddenSegs}
      dateProfile={props.dateProfile}
      todayRange={props.todayRange}
      dateSpanProps={props.dateSpanProps}
      renderProps={props.renderProps}
      isNarrow={false}
      isMicro={false}
      popoverContent={() => (
        <>
          {hiddenSegs.map((seg) => {
            let { eventRange } = seg
            let { instanceId } = eventRange.instance
            let isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
            let isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
            let isInvisible = isDragging || isResizing

            return (
              <div
                key={instanceId}
                role='listitem'
                style={{ visibility: isInvisible ? 'hidden' : undefined }}
              >
                <TimelineEvent
                  isTimeScale={props.isTimeScale}
                  eventRange={eventRange}
                  isStart={seg.isStart}
                  isEnd={seg.isEnd}
                  isDragging={isDragging}
                  isResizing={isResizing}
                  isMirror={false}
                  isSelected={instanceId === props.eventSelection}
                  renderProps={props.renderProps}
                  {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
                />
              </div>
            )
          })}
        </>
      )}
    />
  )
})
