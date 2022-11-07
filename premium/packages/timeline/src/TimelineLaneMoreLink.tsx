import {
  BaseComponent, MoreLinkRoot,
  setRef, DateProfile, DateRange, DateMarker, getSegMeta,
} from '@fullcalendar/core'
import { createElement, createRef, Ref, Fragment } from '@fullcalendar/core/preact'
import { TimelineSegPlacement } from './event-placement.js'
import { coordsToCss } from './TimelineCoords.js'
import { TimelineEvent } from './TimelineEvent.js'
import { TimelineLaneSeg } from './TimelineLaneSlicer.js'

export interface TimelineLaneMoreLinkProps {
  elRef: Ref<HTMLElement>
  hiddenSegs: TimelineLaneSeg[]
  placement: TimelineSegPlacement
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  isTimeScale: boolean
  eventSelection: string
  resourceId?: string
  isForcedInvisible: { [instanceId: string]: any }
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  elRef = createRef<HTMLElement>()

  render() {
    let { props, context } = this
    let { hiddenSegs, placement, resourceId } = props
    let { top, hcoords } = placement
    let isVisible = hcoords && top !== null
    let hStyle = coordsToCss(hcoords, context.isRtl)
    let extraDateSpan = resourceId ? { resourceId } : {}

    return (
      <MoreLinkRoot
        elRef={this.handleEl}
        elClasses={['fc-timeline-more-link']}
        elStyle={{
          visibility: isVisible ? '' : 'hidden',
          top: top || 0,
          ...hStyle,
        }}
        allDayDate={null}
        moreCnt={hiddenSegs.length}
        allSegs={hiddenSegs}
        hiddenSegs={hiddenSegs}
        alignmentElRef={this.elRef}
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
                  style={{ visibility: props.isForcedInvisible[instanceId] ? 'hidden' : '' }}
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
          <InnerContent elClasses={['fc-timeline-more-link-inner', 'fc-sticky']} />
        )}
      </MoreLinkRoot>
    )
  }

  handleEl = (el: HTMLElement) => {
    setRef(this.props.elRef, el)
    setRef(this.elRef, el)
  }
}
