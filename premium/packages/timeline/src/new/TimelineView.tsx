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
} from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { ScrollerSyncer } from '@fullcalendar/scrollgrid/internal'
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
  private bodyEl: HTMLElement
  private headerInnerWidth?: number // within the cells (TODO: just rename these)
  private mainInnerWidth?: number // within the slats
  private currentCanvasWidth?: number
  private currentSlotWidth?: number
  private currentTDateProfile?: TimelineDateProfile

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
    this.currentTDateProfile = tDateProfile
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit
    let { cellRows } = tDateProfile

    /* table settings */

    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    /* table positions */

    let [canvasWidth, slotWidth, slotLiquid] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      options.slotMinWidth,
      state.slotInnerWidth,
      state.scrollerWidth,
    )
    let slotStyleWidth = slotLiquid ? undefined : slotWidth
    this.currentCanvasWidth = canvasWidth
    this.currentSlotWidth = slotWidth

    return (
      <NowTimer unit={timerUnit}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const enableNowIndicator = // TODO: DRY
            options.nowIndicator &&
            slotWidth != null &&
            rangeContainsMarker(props.dateProfile.currentRange, nowDate)

          return (
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

              {/* HEADER
              ---------------------------------------------------------------------------------- */}
              <Scroller
                ref={this.headerScrollerRef}
                horizontal
                hideScrollbars
                elClassNames={[stickyHeaderDates ? 'fcnew-v-sticky' : '']}
              >
                <div style={{
                  width: canvasWidth,
                  paddingLeft: state.leftScrollbarWidth,
                  paddingRight: state.rightScrollbarWidth,
                }}>
                  {cellRows.map((cells, rowLevel) => (
                    <TimelineHeaderRow
                      key={rowLevel}
                      dateProfile={props.dateProfile}
                      tDateProfile={tDateProfile}
                      nowDate={nowDate}
                      todayRange={todayRange}
                      rowLevel={rowLevel}
                      isLastRow={rowLevel === cellRows.length - 1}
                      cells={cells}
                      slotWidth={slotStyleWidth}
                      innerWidthRef={this.handleHeaderInnerWidth}
                    />
                  ))}
                  {enableNowIndicator && (
                    // TODO: make this positioned WITHIN padding
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
              <Scroller // how does it know to be liquid-height?
                ref={this.bodyScrollerRef}
                vertical
                horizontal
                elClassNames={['fcnew-flexexpand']}
                widthRef={this.handleScrollerWidth}
                leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
                rightScrollbarWidthRef={this.handleRightScrollbarWidth}
              >
                <div
                  ref={this.handeBodyEl}
                  className="fc-timeline-body"
                >
                  <TimelineSlats
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}
                    slotWidth={slotStyleWidth}
                    innerWidthRef={this.handleMainInnerWidth}
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

  handleHeaderInnerWidth = (innerWidth: number) => {
    this.headerInnerWidth = innerWidth
    afterSize(this.handleSlotInnerWidths)
  }

  handleMainInnerWidth = (innerWidth: number) => {
    this.mainInnerWidth = innerWidth
    afterSize(this.handleSlotInnerWidths)
  }

  handleSlotInnerWidths = () => {
    const { state } = this
    const slotInnerWidth = Math.max(
      this.headerInnerWidth,
      this.mainInnerWidth,
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
    ])
  }

  handleScrollRequest = (request: ScrollRequest) => {
    const { props, context } = this
    let slotWidth = this.currentSlotWidth
    let tDateProfile = this.currentTDateProfile

    if (request.time) {
      if (slotWidth != null && tDateProfile != null) {
        let x = timeToCoord(request.time, context.dateEnv, props.dateProfile, tDateProfile, slotWidth)
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

  queryHit(positionLeft: number): Hit {
    const { dateEnv, isRtl } = this.context
    const tDateProfile = this.currentTDateProfile
    const canvasWidth = this.currentCanvasWidth
    const slatWidth = this.currentSlotWidth // TODO: renames?

    if (slatWidth) {
      const slatIndex = Math.floor(positionLeft / slatWidth)
      const slatLeft = slatIndex * slatWidth
      const partial = (positionLeft - slatLeft) / slatWidth // floating point number between 0 and 1
      const localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot) // the snap # relative to start of slat

      let start = dateEnv.add(
        tDateProfile.slotDates[slatIndex],
        multiplyDuration(tDateProfile.snapDuration, localSnapIndex),
      )
      let end = dateEnv.add(start, tDateProfile.snapDuration)

      // TODO: generalize this coord stuff to TimeGrid?

      let snapWidth = slatWidth / tDateProfile.snapsPerSlot
      let startCoord = slatIndex * slatWidth + (snapWidth * localSnapIndex)
      let endCoord = startCoord + snapWidth
      let left: number, right: number

      if (isRtl) {
        left = canvasWidth - endCoord
        right = canvasWidth - startCoord
      } else {
        left = startCoord
        right = endCoord
      }

      return {
        dateProfile: this.props.dateProfile,
        dateSpan: {
          range: { start, end },
          allDay: !tDateProfile.isTimeScale,
        },
        rect: {
          left,
          right,
          top: 0,
          bottom: this.bodyEl.getBoundingClientRect().height // okay to do here?,
        },
        // HACK. TODO: This is expensive to do every hit-query
        dayEl: this.bodyEl.querySelectorAll('.fcnew-slat')[slatIndex] as HTMLElement, // TODO!
        layer: 0,
      }
    }

    return null
  }
}
