import {
  createElement, BaseComponent, Ref, createRef, MoreLinkRoot, setRef, DateProfile, DateRange,
} from '@fullcalendar/common'
import { TimelineSegPlacement } from './event-placement'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

export interface TimelineLaneMoreLinkProps {
  elRef: Ref<HTMLElement>
  hiddenSegs: TimelineLaneSeg[]
  placement: TimelineSegPlacement
  dateProfile: DateProfile
  todayRange: DateRange
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  rootElRef = createRef<HTMLElement>()

  render(props: TimelineLaneMoreLinkProps) {
    let { elRef, placement } = props

    return (
      <MoreLinkRoot
        allDayDate={null}
        allSegs={props.hiddenSegs}
        hiddenSegs={props.hiddenSegs}
        alignmentElRef={this.rootElRef}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
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
