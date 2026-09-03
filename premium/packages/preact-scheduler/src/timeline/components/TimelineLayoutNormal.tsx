import { Duration, joinClassNames } from '@fullcalendar/preact/public-api'
import {
  afterSize,
  computeViewBorderless,
  DateComponent,
  DateMarker,
  DateProfile,
  DateRange,
  FooterScrollbar,
  generateClassName,
  getFooterScrollbarSticky,
  getIsHeightAuto,
  getTableHeaderSticky,
  Hit,
  rangeContainsMarker,
  RefMap,
  Ruler,
  Scroller,
  ScrollerSyncerInterface,
  setRef,
  SlicedProps,
  ViewContainer,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createRef, type Ref } from 'react'
import { ScrollerSyncer } from '../../scrollgrid/ScrollerSyncer'
import { TimelineDateProfile } from '../timeline-date-profile'
import { TimelineRange } from '../TimelineLaneSlicer'
import { computeTimelineHitData, timeToCoord } from '../timeline-positioning'
import { TimelineBg } from './TimelineBg'
import { TimelineFg } from './TimelineFg'
import { TimelineHeaderRow } from './TimelineHeaderRow'
import { TimelineNowIndicatorArrow } from './TimelineNowIndicatorArrow'
import { TimelineNowIndicatorLine } from './TimelineNowIndicatorLine'
import { TimelineSlats } from './TimelineSlats'
import { getTimelineSlotEl } from './util'

export interface TimelineScroll {
  time?: Duration
  x?: number
}

export interface TimelineLayoutNormalProps {
  className?: string
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange
  slicedProps: SlicedProps<TimelineRange>
  canvasWidth: number | undefined
  slotWidth: number | undefined
  clientWidth: number | undefined
  clientWidthRef: Ref<number>
  slotInnerWidthRef: Ref<number>
  initialScroll?: TimelineScroll
  scrollRef?: Ref<TimelineScroll>
}

interface TimelineLayoutNormalState {
  totalWidth?: number
}

export class TimelineLayoutNormal extends DateComponent<TimelineLayoutNormalProps, TimelineLayoutNormalState> {
  state = {} as TimelineLayoutNormalState

  // refs
  private headerScrollerRef = createRef<Scroller>()
  private bodyScrollerRef = createRef<Scroller>()
  private footerScrollerRef = createRef<Scroller>()
  private headerRowInnerWidthMap = new RefMap<number, number>(() => {
    afterSize(this.handleSlotInnerWidths)
  })
  private bodyEl?: HTMLElement

  // internal
  private _isUnmounting: boolean
  private syncedScroller: ScrollerSyncerInterface
  private scroll: TimelineScroll = {}

  render() {
    const { props, state, context } = this
    const { options } = context
    const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)
    const { tDateProfile, nowDate, todayRange, slicedProps, slotWidth, canvasWidth } = props
    const { cellRows } = tDateProfile
    const verticalScrolling = !getIsHeightAuto(options)
    const tableHeaderSticky = getTableHeaderSticky(options)
    const footerScrollbarSticky = getFooterScrollbarSticky(options)
    const endScrollbarWidth = (state.totalWidth != null && props.clientWidth != null)
      ? state.totalWidth - props.clientWidth
      : undefined
    const enableNowIndicator =
      options.nowIndicator &&
      slotWidth != null &&
      rangeContainsMarker(props.dateProfile.currentRange, nowDate)

    return (
      <ViewContainer
        viewSpec={context.viewSpec}
        className={joinClassNames(
          classNames.flexCol,
          props.className,
          generateClassName(options.tableClass, {
            borderlessX,
            borderlessTop,
            borderlessBottom,
            multiMonthColumns: 0,
          }),
          classNames.isolate,
        )}
      >
        <div
          className={joinClassNames(
            generateClassName(options.tableHeaderClass, {
              isSticky: tableHeaderSticky,
              borderlessX,
              borderlessTop,
              borderlessBottom,
              multiMonthColumns: 0,
            }),
            classNames.flexCol,
            tableHeaderSticky && classNames.tableHeaderSticky,
            classNames.z1,
          )}
        >
          <Scroller
            horizontal
            hideScrollbars
            className={classNames.flexRow}
            ref={this.headerScrollerRef}
          >
            <div
              className={joinClassNames(
                classNames.rel,
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
                    nowMs={props.nowMs}
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
                  nowMs={props.nowMs}
                  slotWidth={slotWidth}
                />
              )}
            </div>
            {Boolean(endScrollbarWidth) && (
              <div
                className={joinClassNames(
                  generateClassName(options.fillerClass, { inTableHeader: true }),
                  classNames.borderlessY,
                  classNames.borderlessEnd,
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

        <Scroller
          vertical={verticalScrolling}
          horizontal
          hideScrollbars={footerScrollbarSticky}
          className={joinClassNames(
            generateClassName(options.tableBodyClass, {
              borderlessX,
              borderlessTop,
              borderlessBottom,
              multiMonthColumns: 0,
            }),
            classNames.flexCol,
            verticalScrolling && classNames.liquid,
            classNames.z0,
          )}
          ref={this.bodyScrollerRef}
          clientWidthRef={props.clientWidthRef}
        >
          <div
            aria-label={options.eventsHint}
            className={joinClassNames(classNames.rel, classNames.grow)}
            style={{ width: canvasWidth }}
            ref={this.handleBodyEl}
          >
            <TimelineSlats
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={nowDate}
              nowMs={props.nowMs}
              todayRange={todayRange}
              slotWidth={slotWidth}
            />
            <TimelineBg
              tDateProfile={tDateProfile}
              nowDate={nowDate}
              nowMs={props.nowMs}
              todayRange={todayRange}
              bgEventSegs={slicedProps.bgEventSegs}
              businessHourSegs={slicedProps.businessHourSegs}
              dateSelectionSegs={slicedProps.dateSelectionSegs}
              eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs : null}
              slotWidth={slotWidth}
            />
            <div className={joinClassNames(options.timelineTopClass)} />
            <TimelineFg
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={nowDate}
              nowMs={props.nowMs}
              todayRange={todayRange}
              fgEventSegs={slicedProps.fgEventSegs}
              eventDrag={slicedProps.eventDrag}
              eventResize={slicedProps.eventResize}
              eventSelection={slicedProps.eventSelection}
              slotWidth={slotWidth}
            />
            <div className={joinClassNames(options.timelineBottomClass)} />
            {enableNowIndicator && (
              <TimelineNowIndicatorLine
                tDateProfile={tDateProfile}
                nowMs={props.nowMs}
                slotWidth={slotWidth}
              />
            )}
          </div>
        </Scroller>

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
  }

  componentDidMount() {
    const { props, context } = this
    this._isUnmounting = false
    this.syncedScroller = new ScrollerSyncer(true) // horizontal=true
    this.updateSyncedScroller()

    if (props.initialScroll) {
      this.scroll = { ...props.initialScroll }
      this.applyTimeScroll()
    } else {
      this.resetScroll()
    }

    context.emitter.on('_timeScrollRequest', this.handleTimeScrollRequest)
    this.syncedScroller.addScrollStartListener(this.handleTimeScrollStart)
    this.syncedScroller.addScrollEndListener(this.handleTimeScrollEnd)
  }

  componentDidUpdate(prevProps: TimelineLayoutNormalProps) {
    const { props } = this
    const { options } = this.context

    this.updateSyncedScroller()

    const dateProfileChange = prevProps.dateProfile !== props.dateProfile
    const slotWidthChange = prevProps.slotWidth !== props.slotWidth
    const clientWidthChange = prevProps.clientWidth !== props.clientWidth

    if (dateProfileChange || slotWidthChange || clientWidthChange) {
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

  private handleSlotInnerWidths = () => {
    if (this._isUnmounting) return
    const headerSlotInnerWidth = this.headerRowInnerWidthMap.current.get(this.props.tDateProfile.cellRows.length - 1)

    if (headerSlotInnerWidth != null) {
      setRef(this.props.slotInnerWidthRef, headerSlotInnerWidth)
    }
  }

  private handleTotalWidth = (totalWidth: number) => {
    if (this._isUnmounting) return
    this.setState({ totalWidth })
  }

  private updateSyncedScroller() {
    this.syncedScroller.handleChildren([
      this.headerScrollerRef.current,
      this.bodyScrollerRef.current,
      this.footerScrollerRef.current,
    ])
  }

  private resetScroll() {
    this.handleTimeScrollRequest(this.context.options.scrollTime)
  }

  private handleTimeScrollRequest = (scrollTime: Duration) => {
    this.scroll.time = scrollTime
    this.scroll.x = undefined
    this.applyTimeScroll()
  }

  private handleTimeScrollStart = (isDevice: boolean) => {
    if (isDevice) {
      this.scroll.x = undefined
      this.scroll.time = undefined
    }
  }

  private handleTimeScrollEnd = (isDevice: boolean) => {
    if (isDevice) {
      this.scroll.x = this.syncedScroller.x
      this.scroll.time = undefined
    }

    setRef(this.props.scrollRef, this.scroll)
  }

  private applyTimeScroll() {
    const x = this.computeTimeScroll()

    if (x != null) {
      this.syncedScroller.scrollTo({ x })

      if (this.scroll.x !== x) {
        this.scroll.x = x
        setRef(this.props.scrollRef, this.scroll)
      }
    }
  }

  private computeTimeScroll() {
    const { props, context, scroll } = this
    let { x } = scroll

    if (x == null && scroll.time != null && props.slotWidth != null) {
      x = timeToCoord(scroll.time, context.dateEnv, props.dateProfile, props.tDateProfile, props.slotWidth)

      if (x) {
        x += 1 // overcome border. TODO: DRY this up
      }
    }

    return x
  }

  private handleBodyEl = (el: HTMLElement | null) => {
    this.bodyEl = el

    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(isRtl: boolean, positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    const { props, context } = this

    if (props.slotWidth) {
      const hitData = computeTimelineHitData(
        positionLeft,
        elWidth,
        props.slotWidth,
        isRtl,
        props.tDateProfile,
        context.dateEnv,
      )

      if (!hitData) {
        return null
      }

      return {
        dateProfile: props.dateProfile,
        dateSpan: hitData.dateSpan,
        rect: {
          ...hitData.rect,
          top: 0,
          bottom: elHeight,
        },
        getDayEl: () => getTimelineSlotEl(this.bodyEl, hitData.slatIndex),
        layer: 0,
      }
    }

    return null
  }
}
