import {
  BaseComponent, MoreLinkContainer,
  DateProfile, DateRange, DateMarker, getEventRangeMeta,
  EventRangeProps,
  joinArrayishClassNames,
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
  resourceId?: string // HACK... make a generic keyval like renderProps
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  render() {
    let { props } = this
    let { options } = this.context
    let { hiddenSegs, resourceId, forcedInvisibleMap } = props
    let dateSpanProps = resourceId ? { resourceId } : {}

    return (
      <MoreLinkContainer
        allDayDate={null}
        segs={hiddenSegs}
        hiddenSegs={hiddenSegs}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        dateSpanProps={dateSpanProps}
        isCompact={false}
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
            tag='div'
            className={joinArrayishClassNames(
              options.moreLinkInnerClassNames,
              'fcu-sticky-s',
            )}
          />
        )}
      </MoreLinkContainer>
    )
  }
}
