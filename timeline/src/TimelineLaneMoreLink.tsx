import {
  createElement, BaseComponent, Ref, createRef, MoreLinkRoot, ViewContext,
  buildPublicSeg, EventSegment, setRef, memoize,
} from '@fullcalendar/common'
import { TimelineSegPlacement } from './event-placement'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

export interface TimelineLaneMoreLinkProps {
  elRef: Ref<HTMLElement>
  segPlacement: TimelineSegPlacement
  segs: TimelineLaneSeg[]
}

export class TimelineLaneMoreLink extends BaseComponent<TimelineLaneMoreLinkProps> {
  rootElRef = createRef<HTMLElement>()
  buildPublicSegs = memoize(buildPublicSegs)

  render({ elRef, segPlacement, segs }: TimelineLaneMoreLinkProps) {
    let hiddenSegs = this.buildPublicSegs(segs, this.context)
    return (
      <MoreLinkRoot allSegs={hiddenSegs} hiddenSegs={hiddenSegs} positionElRef={this.rootElRef}>
        {(rootElRef, classNames, innerElRef, innerContent, handleClick) => (
          <a
            ref={(el: HTMLElement | null) => {
              setRef(rootElRef, el) // for MoreLinkRoot
              setRef(elRef, el) // for props props
              setRef(this.rootElRef, el) // for this component
            }}
            className={['fc-timeline-event-more'].concat(classNames).join(' ')}
            style={{
              left: segPlacement.left,
              right: -segPlacement.right,
              top: segPlacement.top,
              visibility: segPlacement.isVisible ? ('' as any) : 'hidden',
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

function buildPublicSegs(segs: TimelineLaneSeg[], context: ViewContext): EventSegment[] {
  return segs.map((seg) => buildPublicSeg(seg, context))
}
