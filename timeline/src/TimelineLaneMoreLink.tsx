import {
  createElement, BaseComponent, Ref, createRef, MoreLinkRoot, setRef,
} from '@fullcalendar/common'
import { TimelineSegPlacement } from './event-placement'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

export interface TimelineLaneMoreLinkProps {
  elRef: Ref<HTMLElement>
  hiddenSegs: TimelineLaneSeg[]
  placement: TimelineSegPlacement
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  rootElRef = createRef<HTMLElement>()

  render({ elRef, placement, hiddenSegs }: TimelineLaneMoreLinkProps) {
    return (
      <MoreLinkRoot
        allDayDate={null}
        allSegs={hiddenSegs}
        hiddenSegs={hiddenSegs}
        positionElRef={this.rootElRef}
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
