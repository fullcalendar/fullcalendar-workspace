import { Duration } from '@fullcalendar/core'
import { ViewProps, memoize, ViewContainer, DateComponent, Hit, greatestDurationDenominator, NowTimer, DateMarker, DateRange, NowIndicatorContainer, getStickyHeaderDates, getStickyFooterScrollbar, NewScroller, ScrollRequest, ViewContext } from '@fullcalendar/core/internal'
import { Fragment, createElement, createRef } from '@fullcalendar/core/preact'
import { ScrollController, ScrollJoiner } from '@fullcalendar/scrollgrid/internal'
import { buildTimelineDateProfile } from './timeline-date-profile.js'
import { TimelineHeader } from './TimelineHeader.js'
import { TimelineCoords, coordToCss } from './TimelineCoords.js'
import { TimelineSlats } from './TimelineSlats.js'
import { TimelineLane } from './TimelineLane.js'
import { computeSlotWidth } from './timeline-positioning.js'

interface TimelineViewState {
  slatCoords?: TimelineCoords
  slotCushionMaxWidth?: number
  viewInnerWidth?: number,
  leftScrollbarWidth?: number,
  rightScrollbarWidth?: number,
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private computeSlotWidth = memoize(computeSlotWidth)

  // refs
  private slatsRef = createRef<TimelineSlats>()

  // unmanaged state
  private forcedTimeScroll?: Duration

  // scroll managers
  private headerScroll = new ScrollController()
  private bodyScroll = new ScrollController()
  private footerScroll = new ScrollController()
  private scrollJoiner = new ScrollJoiner([
    this.headerScroll,
    this.bodyScroll,
    this.footerScroll,
  ])

  constructor(props: ViewProps, context: ViewContext) {
    super(props, context)

    // scroll manager further initialization
    this.scrollJoiner.addScrollListener(() => {
      this.forcedTimeScroll = undefined
    })
  }

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
    let [normalSlotWidth, lastSlotWidth, canvasWidth] = this.computeSlotWidth(
      tDateProfile,
      slotMinWidth,
      state.slotCushionMaxWidth,
      state.viewInnerWidth
    )

    return (
      <ViewContainer
        elClasses={[
          'fc-newnew-flexexpand', // expand within fc-view-harness
          'fc-newnew-flexparent',
          'fc-timeline',
          options.eventOverlap === false ?
            'fc-timeline-overlap-disabled' :
            '',
        ]}
        viewSpec={context.viewSpec}
      >
        {/* header */}
        <NewScroller
          horizontal
          hideBars
          className={stickyHeaderDates ? 'fc-newnew-v-sticky' : ''}
          elRef={this.headerScroll.handleEl}
        >
          <div style={{
            width: canvasWidth,
            paddingLeft: state.leftScrollbarWidth,
            paddingRight: state.rightScrollbarWidth,
          }}>
            <TimelineHeader
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              slatCoords={state.slatCoords}
              onMaxCushionWidth={this.handleMaxCushionWidth}
              normalSlotWidth={normalSlotWidth}
              lastSlotWidth={lastSlotWidth}
            />
          </div>
        </NewScroller>

        {/* body */}
        <NewScroller // how does it know to be liquid-height?
          vertical
          horizontal
          className='fc-newnew-flexexpand'
          elRef={this.bodyScroll.handleEl}
          onWidth={this.handleViewInnerWidth}
          onLeftScrollbarWidth={this.handleLeftScrollbarWidth}
          onRightScrollbarWidth={this.handleRightScrollbarWidth}
        >
          <div
            ref={this.handeBodyEl}
            className="fc-timeline-body"
          >
            <NowTimer unit={timerUnit}>
              {(nowDate: DateMarker, todayRange: DateRange) => (
                <Fragment>
                  <TimelineSlats
                    ref={this.slatsRef}
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}
                    normalSlotWidth={normalSlotWidth}
                    lastSlotWidth={lastSlotWidth}
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
                      <NowIndicatorContainer
                        elClasses={['fc-timeline-now-indicator-line']}
                        elStyle={coordToCss(state.slatCoords.dateToCoord(nowDate), context.isRtl)}
                        isAxis={false}
                        date={nowDate}
                      />
                    </div>
                  )}
                </Fragment>
              )}
            </NowTimer>
          </div>
        </NewScroller>

        {/* footer scrollbar */}
        {stickyFooterScrollbar && (
          <NewScroller
            horizontal
            elRef={this.footerScroll.handleEl}
          >
            <div style={{ width: canvasWidth }}/>
          </NewScroller>
        )}
      </ViewContainer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    // scrolling
    this.handleTimeScroll(this.context.options.scrollTime)
    this.context.emitter.on('_scrollRequest', this.handleScroll)
  }

  componentDidUpdate(
    prevProps: ViewProps,
    prevState: TimelineViewState,
  ) {
    // anything change that affects horizontal coordinates?
    if (
      prevProps.dateProfile !== this.props.dateProfile ||
      prevState.slatCoords !== this.state.slatCoords
    ) {
      this.applyTimeScroll()
    }
  }

  componentWillUnmount() {
    // scrolling
    this.context.emitter.off('_scrollRequest', this.handleScroll)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  /*
  TODO: have Calendar, which manage view-harness, tell us about width explicitly?
  */
  handleViewInnerWidth = (viewInnerWidth: number) => {
    this.setState({
      viewInnerWidth,
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

  handleScroll = (request: ScrollRequest) => {
    if (request.time) {
      this.handleTimeScroll(request.time)
    }
  }

  handleTimeScroll = (time: Duration) => {
    this.forcedTimeScroll = time
    this.applyTimeScroll()
  }

  applyTimeScroll() {
    let timeScroll = this.forcedTimeScroll

    if (timeScroll) {
      let { slatCoords } = this.state
      if (slatCoords) {
        let scrollLeft = slatCoords.coordFromLeft(slatCoords.durationToCoord(timeScroll))
        this.scrollJoiner.scrollTo(scrollLeft)
      }
    }
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
