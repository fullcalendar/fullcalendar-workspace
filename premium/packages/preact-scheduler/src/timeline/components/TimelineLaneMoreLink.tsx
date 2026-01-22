import {
  BaseComponent, DateMarker, DateProfile, DateRange, EventRangeProps, EventSegUiInteractionState, getEventRangeMeta, MoreLinkContainer
} from '@fullcalendar/preact/protected-api'
import { TimelineRange } from '../TimelineLaneSlicer'
import { TimelineEvent } from './TimelineEvent'

export interface TimelineLaneMoreLinkProps {
  dateProfile: DateProfile
  isTimeScale: boolean
  nowDate: DateMarker
  todayRange: DateRange

  // content
  hiddenSegs: (TimelineRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<TimelineRange> | null
  eventResize: EventSegUiInteractionState<TimelineRange> | null
  eventSelection: string
  resourceId?: string // HACK... make a generic keyval like renderProps
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  render() {
    let { props } = this
    let { hiddenSegs, resourceId } = props
    let dateSpanProps = resourceId ? { resourceId } : {}

    return (
      <MoreLinkContainer
        display='row'
        allDayDate={null}
        segs={hiddenSegs}
        hiddenSegs={hiddenSegs}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        dateSpanProps={dateSpanProps}
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
                    {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate)}
                  />
                </div>
              )
            })}
          </>
        )}
      />
    )
  }
}
