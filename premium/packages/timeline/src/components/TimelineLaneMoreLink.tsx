import {
  BaseComponent, MoreLinkContainer,
  DateProfile, DateRange, DateMarker, getEventRangeMeta,
  EventRangeProps,
} from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { TimelineEvent } from './TimelineEvent.js'
import { TimelineRange } from '../TimelineLaneSlicer.js'

export interface TimelineLaneMoreLinkProps {
  dateProfile: DateProfile
  isTimeScale: boolean
  nowDate: DateMarker
  todayRange: DateRange

  // content
  hiddenSegs: (TimelineRange & EventRangeProps)[]
  eventSelection: string
  forcedInvisibleMap: { [instanceId: string]: any }
  resourceId?: string // HACK... make a generic keyval like extraRenderProps
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  render() {
    let { props } = this
    let { hiddenSegs, resourceId, forcedInvisibleMap } = props
    let extraDateSpan = resourceId ? { resourceId } : {}

    return (
      <MoreLinkContainer
        elClasses={['fc-timeline-more-link']}
        allDayDate={null}
        segs={hiddenSegs}
        hiddenSegs={hiddenSegs}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        extraDateSpan={extraDateSpan}
        popoverContent={() => (
          <Fragment>
            {hiddenSegs.map((seg) => {
              let { eventRange } = seg
              let instanceId = eventRange.instance.instanceId

              return (
                <div
                  key={instanceId}
                  style={{ visibility: forcedInvisibleMap[instanceId] ? 'hidden' : '' }}
                >
                  <TimelineEvent
                    isTimeScale={props.isTimeScale}
                    eventRange={eventRange}
                    isStart={seg.isStart}
                    isEnd={seg.isEnd}
                    isDragging={false}
                    isResizing={false}
                    isDateSelecting={false}
                    isSelected={instanceId === props.eventSelection}
                    {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate)}
                  />
                </div>
              )
            })}
          </Fragment>
        )}
      >
        {(InnerContent) => (
          <InnerContent
            elTag="div"
            elClasses={['fc-timeline-more-link-inner', 'fc-sticky-x']}
          />
        )}
      </MoreLinkContainer>
    )
  }
}
