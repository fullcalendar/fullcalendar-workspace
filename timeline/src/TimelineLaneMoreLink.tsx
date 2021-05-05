import {
  createElement, BaseComponent, Ref, createRef, MoreLinkRoot, setRef, DateProfile, DateRange, DateMarker, Fragment, getSegMeta,
} from '@fullcalendar/common'
import { TimelineSegPlacement } from './event-placement'
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
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  rootElRef = createRef<HTMLElement>()

  render(props: TimelineLaneMoreLinkProps) {
    let { elRef, placement, resourceId } = props
    let extraDateSpan = resourceId ? { resourceId } : {}

    return (
      <MoreLinkRoot
        allDayDate={null}
        allSegs={props.hiddenSegs}
        hiddenSegs={props.hiddenSegs}
        alignmentElRef={this.rootElRef}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        extraDateSpan={extraDateSpan}
        popoverContent={() => (
          <Fragment>
            {props.hiddenSegs.map((seg) => (
              <TimelineEvent
                isTimeScale={props.isTimeScale}
                seg={seg}
                isDragging={false}
                isResizing={false}
                isDateSelecting={false}
                isSelected={seg.eventRange.instance.instanceId === props.eventSelection}
                {...getSegMeta(seg, props.todayRange, props.nowDate)}
              />
            ))}
          </Fragment>
        )}
      >
        {(rootElRef, classNames, innerElRef, innerContent, handleClick) => (
          <a
            ref={(el: HTMLElement | null) => {
              setRef(rootElRef, el) // for MoreLinkRoot
              setRef(elRef, el) // for props props
              setRef(this.rootElRef, el) // for this component
            }}
            className={['fc-timeline-event-more'].concat(classNames).join(' ')}
            style={{
              left: placement.left,
              right: -placement.right,
              top: placement.top,
              visibility: placement.isVisible ? ('' as any) : 'hidden',
            }}
            onClick={handleClick}
          >
            <div ref={innerElRef} className='fc-timeline-event-more-inner fc-sticky'>
              {innerContent}
            </div>
          </a>
        )}
      </MoreLinkRoot>
    )
  }
}
