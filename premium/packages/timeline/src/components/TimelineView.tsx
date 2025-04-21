import { Duration } from '@fullcalendar/core'
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
  rangeContainsMarker,
  multiplyDuration,
  afterSize,
  ScrollerSyncerInterface,
  getIsHeightAuto,
  RefMap,
  joinClassNames,
  Ruler,
  FooterScrollbar,
  generateClassName,
  joinArrayishClassNames,
} from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { ScrollerSyncer } from '@fullcalendar/scrollgrid/internal'
import { buildTimelineDateProfile, TimelineDateProfile } from '../timeline-date-profile.js'
import { TimelineSlats } from './TimelineSlats.js'
import { TimelineHeaderRow } from './TimelineHeaderRow.js'
import { computeSlotWidth, timeToCoord } from '../timeline-positioning.js'
import { TimelineNowIndicatorLine } from './TimelineNowIndicatorLine.js'
import { TimelineNowIndicatorArrow } from './TimelineNowIndicatorArrow.js'
import { getTimelineSlotEl } from './util.js'
import { TimelineLaneSlicer } from '../TimelineLaneSlicer.js'
import { TimelineFg } from './TimelineFg.js'
import { TimelineBg } from './TimelineBg.js'

interface TimelineViewState {
  totalWidth?: number
  clientWidth?: number
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
  private headerRowInnerWidthMap = new RefMap<number, number>(() => { // just for timeline-header
    afterSize(this.handleSlotInnerWidths)
  })
  private bodySlotInnerWidth?: number

  // internal
  private syncedScroller: ScrollerSyncerInterface
  private scrollTime: Duration | null = null
  private slicer = new TimelineLaneSlicer()

  render() {
    const { props, state, context } = this
    const { options } = context

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
      clientWidth,
    )
    this.slotWidth = slotWidth

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
      <NowTimer unit={timerUnit}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const enableNowIndicator = // TODO: DRY
            options.nowIndicator &&
            slotWidth != null &&
            rangeContainsMarker(props.dateProfile.currentRange, nowDate)

          return (
            <ViewContainer
              viewSpec={context.viewSpec}
              className={joinClassNames(
                // HACK for Safari print-mode, where fc-scroller-no-bars won't take effect for
                // the below Scrollers if they have liquid flex height
                !props.forPrint && 'fc-flex-col',
                props.className,
              )}
              borderX={props.borderX}
              borderTop={props.borderTop}
              borderBottom={props.borderBottom}
            >

              {/* HEADER
              ---------------------------------------------------------------------------------- */}
              <div className={joinClassNames(
                'fc-timeline-header',
                stickyHeaderDates && 'fc-table-header-sticky',
                generateClassName(options.viewHeaderClassNames, {
                  borderX: props.borderX,
                  isSticky: stickyHeaderDates,
                }),
              )}>
                <Scroller
                  horizontal
                  hideScrollbars
                  className='fc-flex-row'
                  ref={this.headerScrollerRef}
                >
                  <div
                    // TODO: DRY
                    className={joinClassNames(
                      'fc-rel', // origin for now-indicator
                      canvasWidth == null && 'fc-liquid',
                    )}
                    style={{ width: canvasWidth }}
                  >
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
                          innerWidthRef={this.headerRowInnerWidthMap.createRef(rowLevel)}
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
                      className={joinArrayishClassNames(
                        options.fillerClassNames,
                        options.fillerXClassNames,
                      )}
                      style={{ minWidth: endScrollbarWidth }}
                    />
                  )}
                </Scroller>
                <div
                  className={joinArrayishClassNames(options.slotLabelDividerClassNames)}
                />
              </div>

              {/* BODY
              ---------------------------------------------------------------------------------- */}
              <Scroller
                vertical={verticalScrolling}
                horizontal
                hideScrollbars={
                  stickyFooterScrollbar ||
                  props.forPrint // prevents blank space in print-view on Safari
                }
                className={joinClassNames(
                  'fc-timeline-body fc-flex-col',
                  verticalScrolling && 'fc-liquid',
                  generateClassName(options.viewBodyClassNames, {
                    borderX: props.borderX,
                  }),
                )}
                ref={this.bodyScrollerRef}
                clientWidthRef={this.handleClientWidth}
              >
                <div
                  aria-label={options.eventsHint}
                  className="fc-rel fc-grow"
                  style={{ width: canvasWidth }}
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
                  <TimelineBg
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}

                    // content
                    bgEventSegs={slicedProps.bgEventSegs}
                    businessHourSegs={slicedProps.businessHourSegs}
                    dateSelectionSegs={slicedProps.dateSelectionSegs}
                    eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs : null}

                    // dimensions
                    slotWidth={slotWidth}
                  />
                  <div
                    className={joinArrayishClassNames(
                      options.timelineTopClassNames,
                    )}
                  />
                  <TimelineFg
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}

                    // content
                    fgEventSegs={slicedProps.fgEventSegs}
                    eventDrag={slicedProps.eventDrag}
                    eventResize={slicedProps.eventResize}
                    eventSelection={slicedProps.eventSelection}

                    // dimensions
                    slotWidth={slotWidth}
                  />
                  <div
                    className={joinArrayishClassNames(
                      'fc-timeline-lane-footer',
                      options.timelineBottomClassNames,
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
              {Boolean(stickyFooterScrollbar) && (
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
    this.syncedScroller = new ScrollerSyncer(true) // horizontal=true
    this.updateSyncedScroller()
    this.resetScroll()
    this.context.emitter.on('_timeScrollRequest', this.handleTimeScrollRequest)
    this.syncedScroller.addScrollEndListener(this.handleTimeScrollEnd)
  }

  componentDidUpdate(prevProps: ViewProps) {
    this.updateSyncedScroller()

    if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
      this.resetScroll()
    } else {
      // TODO: inefficient to update so often
      this.applyTimeScroll()
    }
  }

  componentWillUnmount() {
    this.syncedScroller.destroy()
    this.context.emitter.off('_timeScrollRequest', this.handleTimeScrollRequest)
    this.syncedScroller.removeScrollEndListener(this.handleTimeScrollEnd)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleBodySlotInnerWidth = (innerWidth: number) => {
    this.bodySlotInnerWidth = innerWidth
    afterSize(this.handleSlotInnerWidths)
  }

  handleSlotInnerWidths = () => {
    const headerSlotInnerWidth = this.headerRowInnerWidthMap.current.get(this.tDateProfile.cellRows.length - 1)
    const { bodySlotInnerWidth } = this

    if (headerSlotInnerWidth != null && bodySlotInnerWidth != null) {
      const slotInnerWidth = Math.max(headerSlotInnerWidth, bodySlotInnerWidth)

      if (slotInnerWidth !== this.state.slotInnerWidth) {
        this.setState({ slotInnerWidth })
      }
    }
  }

  handleTotalWidth = (totalWidth: number) => {
    this.setState({
      totalWidth,
    })
  }

  handleClientWidth = (clientWidth: number) => {
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
    this.applyTimeScroll()
  }

  private handleTimeScrollEnd = (isUser: boolean) => {
    if (isUser) {
      this.scrollTime = null
    }
  }

  private applyTimeScroll() {
    const { props, context, tDateProfile, scrollTime, slotWidth } = this

    if (scrollTime != null && slotWidth != null) {
      let x = timeToCoord(scrollTime, context.dateEnv, props.dateProfile, tDateProfile, slotWidth)

      if (x) {
        x += 1 // overcome border. TODO: DRY this up
      }

      this.syncedScroller.scrollTo({ x })
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
        getDayEl: () => getTimelineSlotEl(this.bodyEl, slatIndex),
        layer: 0,
      }
    }

    return null
  }
}
