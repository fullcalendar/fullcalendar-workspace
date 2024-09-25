import {
  BaseComponent, MoreLinkContainer,
  DateProfile, DateRange, DateMarker, getSegMeta,
} from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { TimelineEvent } from './TimelineEvent.js'
import { TimelineLaneSeg } from '../TimelineLaneSlicer.js'

export interface TimelineLaneMoreLinkProps {
  dateProfile: DateProfile
  isTimeScale: boolean
  nowDate: DateMarker
  todayRange: DateRange

  // content
  hiddenSegs: TimelineLaneSeg[]
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
        elClasses={['fcnew-timeline-more-link']}
        allDayDate={null}
        segs={hiddenSegs}
        hiddenSegs={hiddenSegs}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        extraDateSpan={extraDateSpan}
        popoverContent={() => (
          <Fragment>
            {hiddenSegs.map((seg) => {
              let instanceId = seg.eventRange.instance.instanceId
              return (
                <div
                  key={instanceId}
                  style={{ visibility: forcedInvisibleMap[instanceId] ? 'hidden' : '' }}
                >
                  <TimelineEvent
                    isTimeScale={props.isTimeScale}
                    seg={seg}
                    isDragging={false}
                    isResizing={false}
                    isDateSelecting={false}
                    isSelected={instanceId === props.eventSelection}
                    {...getSegMeta(seg, props.todayRange, props.nowDate)}
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
            elClasses={['fcnew-timeline-more-link-inner', 'fcnew-sticky-x']}
          />
        )}
      </MoreLinkContainer>
    )
  }
}
