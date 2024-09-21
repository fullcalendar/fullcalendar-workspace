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
  getStickyHeaderDates,
  getStickyFooterScrollbar,
  Scroller,
  ScrollRequest,
  ScrollResponder,
  getScrollerSyncerClass,
  rangeContainsMarker,
  multiplyDuration,
  afterSize,
  ScrollerSyncerInterface,
  getIsHeightAuto,
} from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { buildTimelineDateProfile, TimelineDateProfile } from '../timeline-date-profile.js'
import { TimelineSlats } from './TimelineSlats.js'
import { TimelineLane } from './TimelineLane.js'
import { TimelineHeaderRow } from './TimelineHeaderRow.js'
import { computeSlotWidth, timeToCoord } from '../timeline-positioning.js'
import { TimelineNowIndicatorLine } from './TimelineNowIndicatorLine.js'
import { TimelineNowIndicatorArrow } from './TimelineNowIndicatorArrow.js'

interface TimelineViewState {
  scrollerWidth?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  slotInnerWidth?: number
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private computeSlotWidth = memoize(computeSlotWidth)

  // refs
  private headerScrollerRef = createRef<Scroller>()
  private bodyScrollerRef = createRef<Scroller>()
  private footerScrollerRef = createRef<Scroller>()
  private tDateProfile?: TimelineDateProfile
  private bodyEl?: HTMLElement
  private slotWidth?: number
  private headerSlotInnerWidth?: number
  private bodySlotInnerWidth?: number

  // internal
  private scrollResponder: ScrollResponder
  private syncedScroller: ScrollerSyncerInterface

  render() {
    const { props, state, context } = this
    const { options } = context

    /* date */

    const tDateProfile = this.tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )
    const { cellRows } = tDateProfile
    const timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    /* table settings */

    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    /* table positions */

    const [canvasWidth, slotWidth] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      state.slotInnerWidth, // is ACTUALLY the label width. rename?
      state.scrollerWidth,
    )
    this.slotWidth = slotWidth

    return (
      <NowTimer unit={timerUnit}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const enableNowIndicator = // TODO: DRY
            options.nowIndicator &&
            slotWidth != null &&
            rangeContainsMarker(props.dateProfile.currentRange, nowDate)

          return (
            <ViewContainer
              viewSpec={context.viewSpec}
              elClasses={[
                'fcnew-bordered',
                'fcnew-flex-column',
                'fcnew-timeline',
                options.eventOverlap === false ?
                  'fcnew-timeline-overlap-disabled' :
                  '',
              ]}
            >

              {/* HEADER
              ---------------------------------------------------------------------------------- */}
              <Scroller
                horizontal
                hideScrollbars
                elClassNames={[
                  'fcnew-rowgroup',
                  stickyHeaderDates ? 'fcnew-sticky-header' : '',
                ]}
                ref={this.headerScrollerRef}
              >
                <div
                  className='fcnew-rel fcnew-content-box' // origin for now-indicator
                  style={{
                    width: canvasWidth,
                    paddingLeft: state.leftScrollbarWidth,
                    paddingRight: state.rightScrollbarWidth,
                  }}
                >
                  <div>
                    {cellRows.map((cells, rowLevel) => {
                      const isLast = rowLevel === cellRows.length - 1
                      return (
                        <TimelineHeaderRow
                          key={rowLevel}
                          dateProfile={props.dateProfile}
                          tDateProfile={tDateProfile}
                          nowDate={nowDate}
                          todayRange={todayRange}
                          rowLevel={rowLevel}
                          isLastRow={isLast}
                          cells={cells}
                          slotWidth={slotWidth}
                          innerWidthRef={isLast ? this.handleHeaderSlotInnerWidth : undefined}
                        />
                      )
                    })}
                  </div>
                  {enableNowIndicator && (
                    // TODO: make this positioned WITHIN padding?
                    <TimelineNowIndicatorArrow
                      tDateProfile={tDateProfile}
                      nowDate={nowDate}
                      slotWidth={slotWidth}
                    />
                  )}
                </div>
              </Scroller>

              {/* BODY
              ---------------------------------------------------------------------------------- */}
              <Scroller
                vertical={verticalScrolling}
                horizontal
                elClassNames={[
                  'fcnew-rowgroup',
                  verticalScrolling ? 'fcnew-liquid' : '',
                ]}
                ref={this.bodyScrollerRef}
                widthRef={this.handleScrollerWidth}
                leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
                rightScrollbarWidthRef={this.handleRightScrollbarWidth}
              >
                <div
                  className="fcnew-rel fcnew-grow"
                  style={{
                    width: canvasWidth,
                  }}
                  ref={this.handeBodyEl}
                >
                  <TimelineSlats
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}

                    // ref
                    innerWidthRef={this.handleBodySlotInnerWidth}

                    // dimensions
                    slotWidth={slotWidth}
                  />
                  <TimelineLane
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}
                    nextDayThreshold={options.nextDayThreshold}
                    eventStore={props.eventStore}
                    eventUiBases={props.eventUiBases}
                    businessHours={props.businessHours}
                    dateSelection={props.dateSelection}
                    eventDrag={props.eventDrag}
                    eventResize={props.eventResize}
                    eventSelection={props.eventSelection}
                    slotWidth={slotWidth}
                  />
                  {enableNowIndicator && (
                    <TimelineNowIndicatorLine
                      tDateProfile={tDateProfile}
                      nowDate={nowDate}
                      slotWidth={slotWidth}
                    />
                  )}
                </div>
              </Scroller>

              {/* FOOTER scrollbar
              ---------------------------------------------------------------------------------- */}
              {stickyFooterScrollbar && (
                <Scroller
                  ref={this.footerScrollerRef}
                  horizontal
                >
                  <div style={{ width: canvasWidth }}/>
                </Scroller>
              )}
            </ViewContainer>
          )
        }}
      </NowTimer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
    const ScrollerSyncer = getScrollerSyncerClass(this.context.pluginHooks)
    this.syncedScroller = new ScrollerSyncer(true) // horizontal=true
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

  handleHeaderSlotInnerWidth = (innerWidth: number) => {
    this.headerSlotInnerWidth = innerWidth
    afterSize(this.handleSlotInnerWidths)
  }

  handleBodySlotInnerWidth = (innerWidth: number) => {
    this.bodySlotInnerWidth = innerWidth
    afterSize(this.handleSlotInnerWidths)
  }

  handleSlotInnerWidths = () => {
    const { state } = this
    const slotInnerWidth = Math.max(
      this.headerSlotInnerWidth,
      this.bodySlotInnerWidth,
    )

    if (state.slotInnerWidth !== slotInnerWidth) {
      this.setState({ slotInnerWidth })
    }
  }

  handleScrollerWidth = (scrollerWidth: number) => {
    this.setState({
      scrollerWidth,
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
    ], this.context.isRtl)
  }

  handleScrollRequest = (request: ScrollRequest) => {
    const { props, context, tDateProfile, slotWidth } = this

    if (request.time) {
      if (tDateProfile != null && slotWidth != null) {
        let x = timeToCoord(request.time, context.dateEnv, props.dateProfile, tDateProfile, slotWidth) +
          (context.isRtl ? -1 : 1) // overcome border. TODO: DRY this up
        this.syncedScroller.scrollTo({ x })
        return true
      }
    }

    return false
  }

  // Hit System
  // -----------------------------------------------------------------------------------------------

  handeBodyEl = (el: HTMLElement | null) => {
    this.bodyEl = el

    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    const { props, context, tDateProfile, slotWidth } = this
    const { dateEnv } = context

    if (slotWidth) {
      const x = context.isRtl ? elWidth - positionLeft : positionLeft
      const slatIndex = Math.floor(x / slotWidth)
      const slatX = slatIndex * slotWidth
      const partial = (x - slatX) / slotWidth // floating point number between 0 and 1
      const localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot) // the snap # relative to start of slat

      let startDate = dateEnv.add(
        tDateProfile.slotDates[slatIndex],
        multiplyDuration(tDateProfile.snapDuration, localSnapIndex),
      )
      let endDate = dateEnv.add(startDate, tDateProfile.snapDuration)

      // TODO: generalize this coord stuff to TimeGrid?

      let snapWidth = slotWidth / tDateProfile.snapsPerSlot
      let startCoord = slatIndex * slotWidth + (snapWidth * localSnapIndex)
      let endCoord = startCoord + snapWidth
      let left: number, right: number

      if (context.isRtl) {
        left = elWidth - endCoord
        right = elWidth - startCoord
      } else {
        left = startCoord
        right = endCoord
      }

      return {
        dateProfile: props.dateProfile,
        dateSpan: {
          range: { start: startDate, end: endDate },
          allDay: !tDateProfile.isTimeScale,
        },
        rect: {
          left,
          right,
          top: 0,
          bottom: elHeight,
        },
        // HACK. TODO: This is expensive to do every hit-query
        dayEl: this.bodyEl.querySelectorAll('.fcnew-timeline-slot')[slatIndex] as HTMLElement, // TODO!
        layer: 0,
      }
    }

    return null
  }
}
