import { Duration, joinClassNames } from '@fullcalendar/preact/public-api'
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
  getTableHeaderSticky,
  getFooterScrollbarSticky,
  Scroller,
  rangeContainsMarker,
  multiplyDuration,
  afterSize,
  ScrollerSyncerInterface,
  getIsHeightAuto,
  RefMap,
  Ruler,
  FooterScrollbar,
  generateClassName,
  computeViewBorderless,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createRef } from 'react'
import { ScrollerSyncer } from '../../scrollgrid/ScrollerSyncer'
import { buildTimelineDateProfile, TimelineDateProfile } from '../timeline-date-profile'
import { TimelineSlats } from './TimelineSlats'
import { TimelineHeaderRow } from './TimelineHeaderRow'
import { computeSlotWidth, timeToCoord } from '../timeline-positioning'
import { TimelineNowIndicatorLine } from './TimelineNowIndicatorLine'
import { TimelineNowIndicatorArrow } from './TimelineNowIndicatorArrow'
import { getTimelineSlotEl } from './util'
import { TimelineLaneSlicer } from '../TimelineLaneSlicer'
import { TimelineFg } from './TimelineFg'
import { TimelineBg } from './TimelineBg'

interface TimelineViewState {
  totalWidth?: number
  clientWidth?: number
  slotInnerWidth?: number
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  state = {} as TimelineViewState

  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private computeSlotWidth = memoize(computeSlotWidth)

  // refs
  private headerScrollerRef = createRef<Scroller>()
  private bodyScrollerRef = createRef<Scroller>()
  private footerScrollerRef = createRef<Scroller>()
  private tDateProfile?: TimelineDateProfile
  private bodyEl?: HTMLElement
  private headerRowInnerWidthMap = new RefMap<number, number>(() => { // just for timeline-header
    afterSize(this.handleSlotInnerWidths)
  })

  // internal
  private _isUnmounting: boolean
  private syncedScroller: ScrollerSyncerInterface
  private scrollTime?: Duration
  private scrollX?: number
  private slicer = new TimelineLaneSlicer()

  render() {
    const { props, state, context } = this
    const { options } = context
    const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

    const { totalWidth, clientWidth } = state
    const endScrollbarWidth = (totalWidth != null && clientWidth != null)
      ? totalWidth - clientWidth
      : undefined

    /* date */

    const tDateProfile = this.tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )
    const { cellRows } = tDateProfile
    let { unit: timerUnit, value: timerUnitValue } = greatestDurationDenominator(tDateProfile.slotDuration)

    /* table settings */

    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)
    const tableHeaderSticky = !props.forPrint && getTableHeaderSticky(options)
    const footerScrollbarSticky = !props.forPrint && getFooterScrollbarSticky(options)

    /* table positions */

    const [canvasWidth, slotWidth] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      state.slotInnerWidth, // is ACTUALLY the label width. rename?
      clientWidth,
    )

    /* sliced */

    let slicedProps = this.slicer.sliceProps(
      props,
      props.dateProfile,
      tDateProfile.isTimeScale ? null : options.nextDayThreshold,
      context, // wish we didn't have to pass in the rest of the args...
      props.dateProfile,
      context.dateProfileGenerator,
      tDateProfile,
      context.dateEnv,
    )

    return (
      <NowTimer unit={timerUnit} unitValue={timerUnitValue}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const enableNowIndicator = // TODO: DRY
            !props.forPrint &&
            options.nowIndicator &&
            slotWidth != null &&
            rangeContainsMarker(props.dateProfile.currentRange, nowDate)

          return (
            <ViewContainer
              viewSpec={context.viewSpec}
              className={joinClassNames(
                // HACK for Safari print-mode, where noScrollbars won't take effect for
                // the below Scrollers if they have liquid flex height
                !props.forPrint && classNames.flexCol,
                props.className,
                generateClassName(options.tableClass, {
                  borderlessX,
                  borderlessTop,
                  borderlessBottom,
                  multiMonthColumnCount: 0,
                }),
                classNames.isolate,
              )}
            >

              {/* HEADER
              ---------------------------------------------------------------------------------- */}
              <div
                className={joinClassNames(
                  generateClassName(options.tableHeaderClass, {
                    isSticky: tableHeaderSticky,
                    borderlessX,
                    borderlessTop,
                    borderlessBottom,
                    multiMonthColumnCount: 0,
                  }),
                  classNames.flexCol,
                  tableHeaderSticky && classNames.tableHeaderSticky,
                )}
                style={{
                  zIndex: 1,
                }}
              >
                <Scroller
                  horizontal
                  hideScrollbars
                  className={classNames.flexRow}
                  ref={this.headerScrollerRef}
                >
                  <div
                    // TODO: DRY
                    className={joinClassNames(
                      classNames.rel, // origin for now-indicator
                      canvasWidth == null && classNames.liquid,
                    )}
                    style={{ width: canvasWidth }}
                  >
                    {cellRows.map((cells, rowIndex) => {
                      const rowLevel = cellRows.length - rowIndex - 1
                      return (
                        <TimelineHeaderRow
                          key={rowIndex}
                          dateProfile={props.dateProfile}
                          tDateProfile={tDateProfile}
                          nowDate={nowDate}
                          todayRange={todayRange}
                          rowLevel={rowLevel}
                          cells={cells}
                          slotWidth={slotWidth}
                          innerWidthRef={this.headerRowInnerWidthMap.createRef(rowIndex)}
                        />
                      )
                    })}
                    {enableNowIndicator && (
                      <TimelineNowIndicatorArrow
                        tDateProfile={tDateProfile}
                        nowDate={nowDate}
                        slotWidth={slotWidth}
                      />
                    )}
                  </div>
                  {Boolean(endScrollbarWidth) && (
                    <div
                      className={joinClassNames(
                        generateClassName(options.fillerClass, { inTableHeader: true }),
                        classNames.borderOnlyS,
                      )}
                      style={{ minWidth: endScrollbarWidth }}
                    />
                  )}
                </Scroller>
                <div
                  className={generateClassName(options.slotHeaderDividerClass, {
                    inTableHeader: true,
                    options: { dayMinWidth: options.dayMinWidth },
                  })}
                />
              </div>

              {/* BODY
              ---------------------------------------------------------------------------------- */}
              <Scroller
                vertical={verticalScrolling}
                horizontal
                hideScrollbars={
                  footerScrollbarSticky ||
                  props.forPrint // prevents blank space in print-view on Safari
                }
                className={joinClassNames(
                  generateClassName(options.tableBodyClass, {
                    borderlessX,
                    borderlessTop,
                    borderlessBottom,
                    multiMonthColumnCount: 0,
                  }),
                  classNames.flexCol,
                  verticalScrolling && classNames.liquid,
                )}
                style={{
                  zIndex: 0,
                }}
                ref={this.bodyScrollerRef}
                clientWidthRef={this.handleClientWidth}
              >
                <div
                  aria-label={options.eventsHint}
                  className={joinClassNames(
                    classNames.rel, // for canvas origin?
                    classNames.grow,
                  )}
                  style={{ width: canvasWidth }}
                  ref={this.handeBodyEl}
                >
                  <TimelineSlats
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}

                    // dimensions
                    slotWidth={slotWidth}
                  />
                  <TimelineBg
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}

                    // content
                    bgEventSegs={slicedProps.bgEventSegs}
                    businessHourSegs={props.forPrint ? null : slicedProps.businessHourSegs}
                    dateSelectionSegs={props.forPrint ? null : slicedProps.dateSelectionSegs}
                    eventResizeSegs={props.forPrint ? null : (slicedProps.eventResize ? slicedProps.eventResize.segs : null)}

                    // dimensions
                    slotWidth={slotWidth}
                  />
                  <div
                    className={joinClassNames(
                      options.timelineTopClass,
                    )}
                  />
                  <TimelineFg
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}

                    // content
                    fgEventSegs={slicedProps.fgEventSegs}
                    eventDrag={props.forPrint ? null : slicedProps.eventDrag}
                    eventResize={props.forPrint ? null : slicedProps.eventResize}
                    eventSelection={slicedProps.eventSelection}

                    // dimensions
                    slotWidth={slotWidth}
                  />
                  <div
                    className={joinClassNames(
                      options.timelineBottomClass,
                    )}
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
              {Boolean(footerScrollbarSticky) && (
                <FooterScrollbar
                  isSticky
                  canvasWidth={canvasWidth}
                  scrollerRef={this.footerScrollerRef}
                />
              )}

              <Ruler widthRef={this.handleTotalWidth} />
            </ViewContainer>
          )
        }}
      </NowTimer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this._isUnmounting = false
    this.syncedScroller = new ScrollerSyncer(true) // horizontal=true
    this.updateSyncedScroller()
    this.resetScroll()
    this.context.emitter.on('_timeScrollRequest', this.handleTimeScrollRequest)
    this.syncedScroller.addScrollStartListener(this.handleTimeScrollStart)
    this.syncedScroller.addScrollEndListener(this.handleTimeScrollEnd)
  }

  componentDidUpdate(prevProps: ViewProps, prevState: TimelineViewState) {
    const { props } = this
    const { options } = this.context

    this.updateSyncedScroller()

    const dateProfileChange = prevProps.dateProfile !== props.dateProfile
    const slotWidthChange =
      prevState.clientWidth !== this.state.clientWidth ||
      prevState.slotInnerWidth !== this.state.slotInnerWidth

    if (dateProfileChange || slotWidthChange) {
      if (dateProfileChange && options.scrollTimeReset) {
        this.resetScroll()
      } else {
        this.applyTimeScroll()
      }
    }
  }

  componentWillUnmount() {
    this._isUnmounting = true
    this.syncedScroller.destroy()
    this.context.emitter.off('_timeScrollRequest', this.handleTimeScrollRequest)
    this.syncedScroller.removeScrollStartListener(this.handleTimeScrollStart)
    this.syncedScroller.removeScrollEndListener(this.handleTimeScrollEnd)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleSlotInnerWidths = () => {
    if (this._isUnmounting) return
    const headerSlotInnerWidth = this.headerRowInnerWidthMap.current.get(this.tDateProfile.cellRows.length - 1)

    if (headerSlotInnerWidth != null && headerSlotInnerWidth !== this.state.slotInnerWidth) {
      this.setState({ slotInnerWidth: headerSlotInnerWidth })
    }
  }

  handleTotalWidth = (totalWidth: number) => {
    if (this._isUnmounting) return
    this.setState({
      totalWidth,
    })
  }

  handleClientWidth = (clientWidth: number) => {
    if (this._isUnmounting) return
    this.setState({
      clientWidth,
    })
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  private updateSyncedScroller() {
    this.syncedScroller.handleChildren([
      this.headerScrollerRef.current,
      this.bodyScrollerRef.current,
      this.footerScrollerRef.current
    ])
  }

  private resetScroll() {
    this.handleTimeScrollRequest(this.context.options.scrollTime)
  }

  private handleTimeScrollRequest = (scrollTime: Duration) => {
    this.scrollTime = scrollTime
    this.scrollX = undefined
    this.applyTimeScroll()
  }

  private handleTimeScrollStart = (isUser: boolean) => {
    if (isUser) {
      this.scrollX = undefined
      this.scrollTime = undefined
    }
  }

  private handleTimeScrollEnd = (isUser: boolean) => {
    if (isUser) {
      this.scrollX = this.syncedScroller.x
      this.scrollTime = undefined
    }
  }

  private applyTimeScroll() {
    const x = this.computeTimeScroll()

    if (x != null) {
      this.syncedScroller.scrollTo({ x })
    }
  }

  private computeTimeScroll() {
    const { props, context, tDateProfile, scrollTime, scrollX } = this
    const slotWidth = this.getSlotWidth()
    let x = scrollX

    if (x == null && scrollTime != null && slotWidth != null) {
      x = timeToCoord(scrollTime, context.dateEnv, props.dateProfile, tDateProfile, slotWidth)

      if (x) {
        x += 1 // overcome border. TODO: DRY this up
      }
    }

    return x
  }

  private getSlotWidth() {
    const { tDateProfile, state, context } = this

    if (tDateProfile) {
      return this.computeSlotWidth(
        tDateProfile.slotCnt,
        tDateProfile.slotsPerLabel,
        context.options.slotMinWidth,
        state.slotInnerWidth,
        state.clientWidth,
      )[1]
    }
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

  queryHit(isRtl: boolean, positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    const { props, context, tDateProfile } = this
    const { dateEnv } = context
    const slotWidth = this.getSlotWidth()

    if (slotWidth) {
      const x = isRtl ? elWidth - positionLeft : positionLeft
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

      if (isRtl) {
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
        getDayEl: () => getTimelineSlotEl(this.bodyEl, slatIndex),
        layer: 0,
      }
    }

    return null
  }
}
