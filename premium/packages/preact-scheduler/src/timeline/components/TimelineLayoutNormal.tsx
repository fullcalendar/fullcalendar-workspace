import { Duration, joinClassNames } from '@fullcalendar/preact/public-api'
import {
  afterSize,
  computeViewBorderless,
  DateMarker,
  DateProfile,
  DateRange,
  FooterScrollbar,
  generateClassName,
  getFooterScrollbarSticky,
  getIsHeightAuto,
  getTableHeaderSticky,
  Hit,
  RefMap,
  Ruler,
  Scroller,
  ScrollerSyncerInterface,
  setRef,
  SlicedProps,
  ViewContainer,
  useHitTarget,
  useLatest,
  useMeasuredState,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { ScrollerSyncer } from '../../scrollgrid/ScrollerSyncer'
import { TimelineDateProfile, isNowInTimelineRange } from '../timeline-date-profile'
import { TimelineRange } from '../TimelineLaneSlicer'
import { computeTimelineHitData, timeToCoord } from '../timeline-positioning'
import { TimelineBg } from './TimelineBg'
import { TimelineFg } from './TimelineFg'
import { TimelineHeaderRow } from './TimelineHeaderRow'
import { TimelineNowIndicatorArrow } from './TimelineNowIndicatorArrow'
import { TimelineNowIndicatorLine } from './TimelineNowIndicatorLine'
import { TimelineSlats } from './TimelineSlats'
import { getTimelineSlotEl } from './timeline-slot-el'

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

export const TimelineLayoutNormal = memo(function TimelineLayoutNormal(props: TimelineLayoutNormalProps) {
  const context = useViewContext()
  const { options } = context
  const [totalWidth, setTotalWidth] = useMeasuredState()

  // refs
  const headerScrollerRef = useRef<Scroller | null>(null)
  const bodyScrollerRef = useRef<Scroller | null>(null)
  const footerScrollerRef = useRef<Scroller | null>(null)
  const bodyElRef = useRef<HTMLDivElement | null>(null)

  // the innermost header row's slot label width
  const isActiveRef = useRef(false)
  const propsRef = useLatest(props)
  const [headerRowInnerWidthMap] = useState(() => {
    const handleSlotInnerWidths = () => {
      if (isActiveRef.current) {
        const props = propsRef.current
        const headerSlotInnerWidth = headerRowInnerWidthMap.current.get(props.tDateProfile.cellRows.length - 1)

        if (headerSlotInnerWidth != null) {
          setRef(props.slotInnerWidthRef, headerSlotInnerWidth)
        }
      }
    }
    const headerRowInnerWidthMap = new RefMap<number, number>(() => {
      afterSize(handleSlotInnerWidths)
    })
    return headerRowInnerWidthMap
  })

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)
  const { tDateProfile, nowDate, todayRange, slicedProps, slotWidth, canvasWidth } = props
  const { cellRows } = tDateProfile
  const verticalScrolling = !getIsHeightAuto(options)
  const tableHeaderSticky = getTableHeaderSticky(options)
  const footerScrollbarSticky = getFooterScrollbarSticky(options)
  const endScrollbarWidth = (totalWidth != null && props.clientWidth != null)
    ? totalWidth - props.clientWidth
    : undefined

  // When the canvas fits without scrolling, scrollTo() is a no-op that fires no scroll event,
  // so an uncapped time-based scroll would linger in scrollRef and print would clip the
  // leading slots (#8093)
  const maxHScroll = (canvasWidth != null && props.clientWidth != null)
    ? Math.max(0, canvasWidth - props.clientWidth)
    : undefined


  // Scrolling
  // -----------------------------------------------------------------------------------------------
  // The scroll target ({ time } or { x }) is per instance, and also reported to the view's scrollRef,
  // which survives print, where this layout unmounts: print clips to its x, and the new instance after
  // print starts from it, through initialScroll. A remount of this instance (<Activity>, a Strict Mode
  // replay) keeps its own target instead, which a render-time initialScroll might predate

  const latestRef = useLatest({ props, context, maxHScroll })
  const [scroll] = useState(() => {
    const scroll = {
      state: {} as TimelineScroll, // updated in-place. the object the view's scrollRef holds
      syncer: null as ScrollerSyncerInterface | null,

      computeTimeScroll(): number | undefined {
        const { props, context, maxHScroll } = latestRef.current
        let { x } = scroll.state

        if (x == null && scroll.state.time != null && props.slotWidth != null) {
          x = timeToCoord(scroll.state.time, context.dateEnv, props.dateProfile, props.tDateProfile, props.slotWidth)

          if (x) {
            x += 1 // overcome border. TODO: DRY this up
          }
        }

        if (x !== undefined && maxHScroll !== undefined) {
          x = Math.min(maxHScroll, x)
        }

        return x
      },

      applyTimeScroll() {
        const x = scroll.computeTimeScroll()

        if (x != null) {
          scroll.syncer.scrollTo({ x })

          if (scroll.state.x !== x) {
            scroll.state.x = x
            setRef(latestRef.current.props.scrollRef, scroll.state)
          }
        }
      },

      resetScroll() {
        scroll.handleTimeScrollRequest(latestRef.current.context.options.scrollTime)
      },

      handleTimeScrollRequest(scrollTime: Duration) {
        scroll.state.time = scrollTime
        scroll.state.x = undefined
        scroll.applyTimeScroll()
      },

      handleTimeScrollStart(isDevice: boolean) {
        if (isDevice) {
          scroll.state.x = undefined
          scroll.state.time = undefined
        }
      },

      handleTimeScrollEnd(isDevice: boolean) {
        if (isDevice) {
          scroll.state.x = scroll.syncer.x
          scroll.state.time = undefined
        }

        setRef(latestRef.current.props.scrollRef, scroll.state)
      },
    }
    return scroll
  })

  // each mount, including a shown <Activity> and a Strict Mode replay
  const hasMountedRef = useRef(false)
  useLayoutEffect(() => {
    const { props, context } = latestRef.current
    const syncer = new ScrollerSyncer(true) // horizontal=true
    scroll.syncer = syncer
    syncer.handleChildren(getScrollers())

    const isRemount = hasMountedRef.current
    hasMountedRef.current = true

    if (isRemount) {
      scroll.applyTimeScroll()
    } else if (props.initialScroll) {
      scroll.state = { ...props.initialScroll }
      scroll.applyTimeScroll()
    } else {
      scroll.resetScroll()
    }

    const { emitter } = context
    emitter.on('_timeScrollRequest', scroll.handleTimeScrollRequest)
    syncer.addScrollStartListener(scroll.handleTimeScrollStart)
    syncer.addScrollEndListener(scroll.handleTimeScrollEnd)

    return () => {
      syncer.destroy()
      emitter.off('_timeScrollRequest', scroll.handleTimeScrollRequest)
      syncer.removeScrollStartListener(scroll.handleTimeScrollStart)
      syncer.removeScrollEndListener(scroll.handleTimeScrollEnd)
    }
  }, [])

  // every commit after the first, like componentDidUpdate
  const prevRef = useRef<{ dateProfile: DateProfile, slotWidth: number | undefined, clientWidth: number | undefined } | null>(null)
  useLayoutEffect(() => {
    const prev = prevRef.current
    prevRef.current = { dateProfile: props.dateProfile, slotWidth: props.slotWidth, clientWidth: props.clientWidth }

    if (prev) {
      scroll.syncer.handleChildren(getScrollers())

      const dateProfileChange = prev.dateProfile !== props.dateProfile
      const slotWidthChange = prev.slotWidth !== props.slotWidth
      const clientWidthChange = prev.clientWidth !== props.clientWidth

      if (dateProfileChange || slotWidthChange || clientWidthChange) {
        if (dateProfileChange && options.scrollTimeReset) {
          scroll.resetScroll()
        } else {
          scroll.applyTimeScroll()
        }
      }
    }
  })

  function getScrollers() {
    return [
      headerScrollerRef.current,
      bodyScrollerRef.current,
      footerScrollerRef.current,
    ]
  }

  // Hits
  // -----------------------------------------------------------------------------------------------

  useHitTarget(bodyElRef, {
    queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight): Hit | null {
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
          getDayEl: () => getTimelineSlotEl(bodyElRef.current, hitData.slatIndex),
          layer: 0,
        }
      }

      return null
    },
  })

  const enableNowIndicator =
    options.nowIndicator &&
    slotWidth != null &&
    isNowInTimelineRange(nowDate, props.dateProfile, tDateProfile)

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
          ref={headerScrollerRef}
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
                  innerWidthRef={headerRowInnerWidthMap.createRef(rowIndex)}
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
        ref={bodyScrollerRef}
        clientWidthRef={props.clientWidthRef}
      >
        <div
          className={joinClassNames(classNames.rel, classNames.grow)}
          style={{ width: canvasWidth }}
          ref={bodyElRef}
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
            label={options.eventsHint}
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
          scrollerRef={footerScrollerRef}
        />
      )}

      <Ruler widthRef={setTotalWidth} />
    </ViewContainer>
  )
})
