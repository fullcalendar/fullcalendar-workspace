import {
  Duration, EventStore, EventUiHash, DateSpan, EventInteractionState, ComponentContext,
  DateProfile, DateProfileGenerator,
  BaseComponent, h, memoize, Fragment, RefMap, mapHash, createRef, getSegMeta, DateMarker, DateRange
} from '@fullcalendar/core'
import {TimelineDateProfile } from './timeline-date-profile'
import TimelineCoords from './TimelineCoords'
import TimelineLaneBg from './TimelineLaneBg'
import TimelineLaneSlicer, { TimelineLaneSeg } from './TimelineLaneSlicer'
import TimelineEvent from './TimelineEvent'
import { computeSegHorizontals, computeSegVerticals, TimelineSegDims } from './event-placement'


export interface TimelineLaneProps extends TimelineLaneCoreProps {
  onHeightChange?: (isStable: boolean) => void
}

export interface TimelineLaneCoreProps {
  dateProfile: DateProfile
  dateProfileGenerator: DateProfileGenerator
  nowDate: DateMarker
  todayRange: DateRange
  tDateProfile: TimelineDateProfile
  nextDayThreshold: Duration
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  timelineCoords?: TimelineCoords // TODO: do null instead of undefined? .. SLAT coords
}

interface TimelineLaneState {
  segDims?: { [instanceId: string]: TimelineSegDims }
}


export default class TimelineLane extends BaseComponent<TimelineLaneProps, TimelineLaneState> {

  private slicer = new TimelineLaneSlicer()
  private computeFgSegHorizontals = memoize(computeSegHorizontals) // only for fg event segs, not mirror
  private computeSegVerticals = memoize(computeSegVerticals)
  private harnessElRefs = new RefMap<HTMLDivElement>()
  private innerElRef = createRef<HTMLDivElement>()


  render(props: TimelineLaneProps, state: TimelineLaneState, context: ComponentContext) {
    let { tDateProfile } = props

    let slicedProps = this.slicer.sliceProps(
      props,
      props.dateProfile,
      tDateProfile.isTimeScale ? null : props.nextDayThreshold,
      context.calendar,
      props.dateProfile,
      props.dateProfileGenerator,
      tDateProfile,
      context.dateEnv
    )

    let mirrorSegs =
      (slicedProps.eventDrag ? slicedProps.eventDrag.segs : null) ||
      (slicedProps.eventResize ? slicedProps.eventResize.segs : null) ||
      []

    let segHorizontals = this.computeFgSegHorizontals(slicedProps.fgEventSegs, props.timelineCoords) // ONLY for non-mirror. needed?
    let { segTops, height } = this.computeSegVerticals(slicedProps.fgEventSegs, context.eventOrderSpecs, state.segDims)

    let hiddenSegs = // TODO: more convenient
      (slicedProps.eventDrag ? slicedProps.eventDrag.affectedInstances : null) ||
      (slicedProps.eventResize ? slicedProps.eventResize.affectedInstances : null) ||
      {}

    return (
      <Fragment>
        <TimelineLaneBg
          businessHourSegs={slicedProps.businessHourSegs}
          bgEventSegs={slicedProps.bgEventSegs}
          timelineCoords={props.timelineCoords}
          eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs as TimelineLaneSeg[] : [] /* bad new empty array? */}
          dateSelectionSegs={slicedProps.dateSelectionSegs}
          nowDate={props.nowDate}
          todayRange={props.todayRange}
        />
        <div
          class='fc-timeline-events fc-scrollgrid-sync-inner'
          ref={this.innerElRef}
          style={{ height /* computed by computeSegVerticals */ }}
        >
          {this.renderFgSegs(
            slicedProps.fgEventSegs,
            segHorizontals,
            segTops,
            hiddenSegs,
            false,
            false,
            false
          )}
          {this.renderFgSegs(
            mirrorSegs as TimelineLaneSeg[],
            computeSegHorizontals(mirrorSegs as TimelineLaneSeg[], props.timelineCoords), // not memoized
            segTops, // reuse same tops for mirror
            {},
            Boolean(slicedProps.eventDrag),
            Boolean(slicedProps.eventResize),
            false // because mirror is never drawn for date selection
          )}
        </div>
      </Fragment>
    )
  }


  componentDidMount() {
    this.updateSize()
  }


  componentDidUpdate(prevProps: TimelineLaneProps, prevState: TimelineLaneState) {
    if ( // TODO: use this technique more often
      prevProps.eventStore !== this.props.eventStore ||
      prevProps.timelineCoords !== this.props.timelineCoords
    ) {
      this.updateSize()
    }
  }


  updateSize() {
    let { timelineCoords } = this.props

    if (this.props.onHeightChange) {
      this.props.onHeightChange(false)
    }

    if (timelineCoords) {
      let originRect = timelineCoords.slatRootEl.getBoundingClientRect()

      this.setState({
        segDims: mapHash(this.harnessElRefs.currentMap, (harnessEl) => {
          let harnessRect = harnessEl.getBoundingClientRect()

          return {
            left: harnessRect.left - originRect.left,
            right: harnessRect.right - originRect.left,
            height: harnessRect.height
          }
        })
      }, () => {
        if (this.props.onHeightChange) {
          this.props.onHeightChange(true)
        }
      })
    }
  }


  renderFgSegs(segs: TimelineLaneSeg[], segHorizontals, segTops, hiddenSegs, isDragging, isResizing, isDateSelecting) {
    let { harnessElRefs, props } = this
    let isMirror = isDragging || isResizing || isDateSelecting

    return (
      <Fragment>
        {segs.map((seg) => {
          let instanceId = seg.eventRange.instance.instanceId
          let horizontalCoords = segHorizontals[instanceId]

          if (horizontalCoords) {
            let top = segTops[instanceId]

            return (
              <div
                key={instanceId}
                ref={isMirror ? null : harnessElRefs.createRef(instanceId)}
                class='fc-timeline-event-harness'
                style={{
                  left: horizontalCoords ? horizontalCoords.left : '',
                  right: horizontalCoords ? -horizontalCoords.right : '', // outwards from right edge (which is same as left edge)
                  top: top != null ? top : '',
                  visibility: hiddenSegs[instanceId] ? 'hidden' : ''
                }}
              >
                <TimelineEvent
                  isTimeScale={this.props.tDateProfile.isTimeScale}
                  seg={seg}
                  isDragging={isDragging}
                  isResizing={isResizing}
                  isDateSelecting={isDateSelecting}
                  isSelected={instanceId === this.props.eventSelection /* TODO: bad for mirror? */}
                  {...getSegMeta(seg, props.todayRange, props.nowDate)}
                />
              </div>
            )

          } else { // no use in rendering if don't have horizontal coords yet
            return null
          }
        })}
      </Fragment>
    )
  }

}
