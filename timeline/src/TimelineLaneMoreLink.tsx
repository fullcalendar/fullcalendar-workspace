import {
  createElement, BaseComponent, Ref, createRef, MoreLinkRoot,
  setRef, DateProfile, DateRange, DateMarker, Fragment, getSegMeta,
} from '@fullcalendar/common'
import { TimelineSegPlacement } from './event-placement'
import { coordsToCss } from './TimelineCoords'
import { TimelineEvent } from './TimelineEvent'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

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
  rootElRef = createRef<HTMLElement>()

  render() {
    let { props, context } = this
    let { hiddenSegs, elRef, placement, resourceId } = props
    let { top, hcoords } = placement
    let isVisible = hcoords && top !== null
    let hStyle = coordsToCss(hcoords, context.isRtl)
    let extraDateSpan = resourceId ? { resourceId } : {}

    return (
      <MoreLinkRoot
        allDayDate={null}
        moreCnt={hiddenSegs.length}
        allSegs={hiddenSegs}
        hiddenSegs={hiddenSegs}
        alignmentElRef={this.rootElRef}
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
                  style={{ visibility: props.isForcedInvisible[instanceId] ? 'hidden' : ('' as any) }}
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
        {(rootElRef, classNames, innerElRef, innerContent, handleClick, title, isExpanded, popoverId) => (
          <a
            ref={(el: HTMLElement | null) => {
              setRef(rootElRef, el) // for MoreLinkRoot
              setRef(elRef, el) // for props props
              setRef(this.rootElRef, el) // for this component
            }}
            className={['fc-timeline-more-link'].concat(classNames).join(' ')}
            style={{
              visibility: isVisible ? ('' as any) : 'hidden',
              top: top || 0,
              ...hStyle,
            }}
            onClick={handleClick}
            title={title}
            aria-expanded={isExpanded}
            aria-controls={popoverId}
          >
            <div ref={innerElRef} className="fc-timeline-more-link-inner fc-sticky">
              {innerContent}
            </div>
          </a>
        )}
      </MoreLinkRoot>
    )
  }
}
