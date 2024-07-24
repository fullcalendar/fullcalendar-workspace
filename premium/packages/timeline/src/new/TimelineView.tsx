import {
  ViewProps,
  memoize,
  ViewContainer,
  DateComponent,
  Hit,
  greatestDurationDenominator,
  NowTimer,
  DateMarker,
  DateRange,
  NowIndicatorContainer,
  getStickyHeaderDates,
  getStickyFooterScrollbar,
  Scroller,
  ScrollRequest,
  ScrollResponder,
  getScrollerSyncerClass,
} from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { ScrollerSyncer } from '@fullcalendar/scrollgrid/internal'
import { buildTimelineDateProfile } from '../timeline-date-profile.js'
import { TimelineHeader } from './TimelineHeader.js'
import { TimelineCoords, coordToCss } from '../TimelineCoords.js'
import { TimelineSlats } from './TimelineSlats.js'
import { TimelineLane } from './TimelineLane.js'
import { computeSlotWidth } from '../timeline-positioning.js'

interface TimelineViewState {
  slatCoords?: TimelineCoords // isn't this obsolete??????????????????????
  slotCushionMaxWidth?: number
  width?: number,
  leftScrollbarWidth?: number,
  rightScrollbarWidth?: number,
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private computeSlotWidth = memoize(computeSlotWidth)

  // refs
  private slatsRef = createRef<TimelineSlats>()
  private headerScrollerRef = createRef<Scroller>()
  private bodyScrollerRef = createRef<Scroller>()
  private footerScrollerRef = createRef<Scroller>()

  // internal
  private scrollResponder: ScrollResponder
  private syncedScroller: ScrollerSyncer

  render() {
    let { props, state, context } = this
    let { options } = context

    /* date */

    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    /* table settings */

    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    /* table positions */

    let { slotMinWidth } = options
    let [slotWidth, canvasWidth] = this.computeSlotWidth(
      tDateProfile,
      slotMinWidth,
      state.slotCushionMaxWidth,
      state.width
    )

    return (
      <NowTimer unit={timerUnit}>
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <ViewContainer
            elClasses={[
              'fcnew-flexexpand', // expand within fc-view-harness
              'fcnew-flexparent',
              'fc-timeline',
              options.eventOverlap === false ?
                'fc-timeline-overlap-disabled' :
                '',
            ]}
            viewSpec={context.viewSpec}
            >

            {/* header */}
            <Scroller
              ref={this.headerScrollerRef}
              horizontal
              hideBars
              elClassNames={[stickyHeaderDates ? 'fcnew-v-sticky' : '']}
            >
              <div style={{
                width: canvasWidth,
                paddingLeft: state.leftScrollbarWidth,
                paddingRight: state.rightScrollbarWidth,
              }}>
                <TimelineHeader
                  dateProfile={props.dateProfile}
                  tDateProfile={tDateProfile}
                  nowDate={nowDate}
                  todayRange={todayRange}
                  slatCoords={state.slatCoords}
                  onMaxCushionWidth={this.handleMaxCushionWidth}
                  slotWidth={slotWidth}
                />
              </div>
            </Scroller>

            {/* body */}
            <Scroller // how does it know to be liquid-height?
              ref={this.bodyScrollerRef}
              vertical
              horizontal
              elClassNames={['fcnew-flexexpand']}
              onWidth={this.handleWidth}
              onLeftScrollbarWidth={this.handleLeftScrollbarWidth}
              onRightScrollbarWidth={this.handleRightScrollbarWidth}
            >
              <div
                ref={this.handeBodyEl}
                className="fc-timeline-body"
              >
                <TimelineSlats
                  ref={this.slatsRef}
                  dateProfile={props.dateProfile}
                  tDateProfile={tDateProfile}
                  nowDate={nowDate}
                  todayRange={todayRange}
                  slotWidth={slotWidth}
                  onCoords={this.handleSlatCoords}
                />
                <TimelineLane
                  dateProfile={props.dateProfile}
                  tDateProfile={tDateProfile}
                  nowDate={nowDate}
                  todayRange={todayRange}
                  nextDayThreshold={options.nextDayThreshold}
                  businessHours={props.businessHours}
                  eventStore={props.eventStore}
                  eventUiBases={props.eventUiBases}
                  dateSelection={props.dateSelection}
                  eventSelection={props.eventSelection}
                  eventDrag={props.eventDrag}
                  eventResize={props.eventResize}
                  timelineCoords={state.slatCoords}
                />
                {(options.nowIndicator && state.slatCoords && state.slatCoords.isDateInRange(nowDate)) && (
                  <div className="fc-timeline-now-indicator-container">
                    <NowIndicatorContainer // TODO: make separate component?
                      elClasses={['fc-timeline-now-indicator-line']}
                      elStyle={coordToCss(state.slatCoords.dateToCoord(nowDate), context.isRtl)}
                      isAxis={false}
                      date={nowDate}
                    />
                  </div>
                )}
              </div>
            </Scroller>

            {/* footer scrollbar */}
            {stickyFooterScrollbar && (
              <Scroller
                ref={this.footerScrollerRef}
                horizontal
              >
                <div style={{ width: canvasWidth }}/>
              </Scroller>
            )}
          </ViewContainer>
        )}
      </NowTimer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)

    const ScrollerSyncer = getScrollerSyncerClass(this.context.pluginHooks)
    this.syncedScroller = new ScrollerSyncer()
    this.updateSyncedScroller()
  }

  componentDidUpdate(prevProps: ViewProps) {
    this.scrollResponder.update(prevProps.dateProfile !== this.props.dateProfile)
    this.updateSyncedScroller()
  }

  componentWillUnmount() {
    this.scrollResponder.detach()
    this.syncedScroller.destroy()
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  /*
  TODO: have Calendar, which manage view-harness, tell us about width explicitly?
  */
  handleWidth = (width: number) => {
    this.setState({
      width,
    })
  }

  handleMaxCushionWidth = (slotCushionMaxWidth) => {
    this.setState({
      slotCushionMaxWidth,
    })
  }

  handleSlatCoords = (slatCoords: TimelineCoords | null) => {
    this.setState({
      slatCoords
    })
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({
      leftScrollbarWidth
    })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({
      rightScrollbarWidth
    })
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  updateSyncedScroller() {
    this.syncedScroller.handleChildren([
      this.headerScrollerRef.current,
      this.bodyScrollerRef.current,
      this.footerScrollerRef.current
    ])
  }

  handleScrollRequest = (request: ScrollRequest) => {
    if (request.time) {
      let { slatCoords } = this.state
      if (slatCoords) {
        let scrollLeft = slatCoords.coordFromLeft(slatCoords.durationToCoord(request.time))
        this.syncedScroller.scrollTo({ x: scrollLeft }) // TODO: works with RTL?
        return true
      }
    }

    return false
  }

  // Hit System
  // -----------------------------------------------------------------------------------------------

  handeBodyEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    let slats = this.slatsRef.current
    let slatHit = slats.positionToHit(positionLeft)

    if (slatHit) {
      return {
        dateProfile: this.props.dateProfile,
        dateSpan: slatHit.dateSpan,
        rect: {
          left: slatHit.left,
          right: slatHit.right,
          top: 0,
          bottom: elHeight,
        },
        dayEl: slatHit.dayEl,
        layer: 0,
      }
    }

    return null
  }
}
