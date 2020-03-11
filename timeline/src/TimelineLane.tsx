import {
  Duration, EventStore, EventUiHash, DateSpan, EventInteractionState, ComponentContext,
  DateProfile, DateProfileGenerator,
  BaseComponent, h, CssDimValue, memoize, Fragment, RefMap, mapHash, createRef, getSegMeta, DateMarker, DateRange
} from '@fullcalendar/core'
import {TimelineDateProfile } from './timeline-date-profile'
import TimelineCoords from './TimelineCoords'
import TimelineLaneBg from './TimelineLaneBg'
import TimelineLaneSlicer, { TimelineLaneSeg } from './TimelineLaneSlicer'
import TimelineEvent from './TimelineEvent'
import { computeSegHorizontals, computeSegVerticals, TimelineSegDims } from './event-placement'


export interface TimelineLaneProps {
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
  minHeight?: CssDimValue
  height?: CssDimValue
  timelineCoords?: TimelineCoords // TODO: do null instead of undefined? .. SLAT coords
  onHeight?: (innerEl: HTMLElement | null) => void
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
      <div class='fc-timeline-lane' style={{ height: props.height, minHeight: props.minHeight }}>
        <TimelineLaneBg
          businessHourSegs={slicedProps.businessHourSegs}
          bgEventSegs={slicedProps.bgEventSegs}
          timelineCoords={props.timelineCoords}
          eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs as TimelineLaneSeg[] : [] /* bad new empty array? */}
          dateSelectionSegs={slicedProps.dateSelectionSegs}
        />
        <div class='fc-timeline-events' ref={this.innerElRef} style={{ height /* computed by computeSegVerticals */ }}>
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
      </div>
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


  componentWillUnmount() {
    if (this.props.onHeight) {
      this.props.onHeight(null)
    }
  }


  updateSize() {
    let { timelineCoords } = this.props

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
        if (this.props.onHeight) {
          this.props.onHeight(this.innerElRef.current)
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