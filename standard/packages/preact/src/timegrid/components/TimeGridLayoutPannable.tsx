import { joinClassNames } from '../../util/html'
import { DateMarker, DateRange } from '@full-ui/headless-calendar'
import { DateProfile } from '../../DateProfileGenerator'
import { DayTableCell } from '../../daygrid/DayTableModel'
import { EventRangeProps } from '../../component-util/event-rendering'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { Hit } from '../../interactions/hit'
import { RefMap } from '../../util/RefMap'
import { Ruler } from '../../scrollgrid/Ruler'
import { Scroller } from '../../scrollgrid/Scroller'
import { ScrollerInterface } from '../../scrollgrid/ScrollerInterface'
import { SlicedCoordRange } from '../../coord-range'
import { FooterScrollbar } from '../../common/FooterScrollbar'
import { afterSize } from '../../component-util/resize-observer'
import { getIsHeightAuto, getFooterScrollbarSticky, getTableHeaderSticky } from '../../scrollgrid/util'
import { isArraysEqual } from '../../util/array'
import { generateClassName } from '../../common/render-hook'
import { memo, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { useViewContext } from '../../hooks/useViewContext'
import { useScrollerSyncer } from '../../hooks/useScrollerSyncer'
import { useMeasuredState } from '../../hooks/useMeasuredState'
import classNames from '../../styles.module.css'
import { DayGridHeaderRow } from '../../daygrid/components/DayGridHeaderRow'
import { RowConfig } from '../../daygrid/header-tier'
import { computeDayGridColumns } from '../../daygrid/components/util'
import { TimeSlatMeta } from "../time-slat-meta"
import { TimeGridRange } from "../TimeColsSeg"
import { TimeGridAllDayHeader } from "./TimeGridAllDayHeader"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane"
import { TimeGridCols } from "./TimeGridCols"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow"
import { TimeGridSlatHeader } from "./TimeGridSlatHeader"
import { TimeGridSlatLane } from "./TimeGridSlatLane"
import { computeSlatHeight, computeNowIndicatorDayDate } from './util'
import { TimeGridWeekNumber } from "./TimeGridWeekNumber"
import { computeViewBorderless } from '../../util/misc'
import { TimeGridAxisEmpty } from "./TimeGridAxisEmpty"
import { computeTimeGridPrintMode } from '../print-mode'
import { useSlatHeightReport, useTimeGridAxis } from './useTimeGridAxis'

export interface TimeGridLayoutPannableProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  nowMs?: number
  todayRange: DateRange
  cells: DayTableCell[]
  slatMetas: TimeSlatMeta[]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: RowConfig<any, { text: string, isDisabled: boolean }>[]

  // all-day content
  fgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  bgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  businessHourSegs: (SlicedCoordRange & EventRangeProps)[]
  dateSelectionSegs: (SlicedCoordRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number

  // timed content
  fgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  bgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  businessHourSegsByCol: (TimeGridRange & EventRangeProps)[][]
  nowIndicatorSegsByCol: TimeGridRange[][]
  dateSelectionSegsByCol: (TimeGridRange & EventRangeProps)[][]
  eventDragByCol: EventSegUiInteractionState<TimeGridRange>[]
  eventResizeByCol: EventSegUiInteractionState<TimeGridRange>[]

  // universal content
  eventSelection: string

  // refs
  dayScrollerRef?: Ref<ScrollerInterface>
  timeScrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>

  // dimensions
  dayMinWidth: number
}

/*
The TimeGrid layout with dayMinWidth: the days scroll horizontally, in header, all-day and body
scrollers kept in sync, and the axis scrolls vertically with the body
*/
export const TimeGridLayoutPannable = memo(function TimeGridLayoutPannable(props: TimeGridLayoutPannableProps) {
  const context = useViewContext()
  const {
    axisWidth,
    slatInnerHeight,
    allDayLabelInnerWidthRef,
    headerLabelInnerWidthRefMap,
    slatLabelInnerWidthRefMap,
    slatLabelInnerHeightRefMap,
  } = useTimeGridAxis()
  const [totalWidth, setTotalWidth] = useMeasuredState()
  const [bodyHeight, setBodyHeight] = useMeasuredState()
  const [clientWidth, setClientWidth] = useMeasuredState()
  const [clientHeight, setClientHeight] = useMeasuredState()
  const [stickyBottomScrollbarWidth, setStickyBottomScrollbarWidth] = useMeasuredState()
  const [headerTierHeights, setHeaderTierHeights] = useState<number[]>(EMPTY_HEIGHTS)

  // header tier heights: the taller of each tier's label and main row
  const isActiveRef = useRef(false)
  const headerTierHeightsRef = useRef(headerTierHeights) // what was last set
  const [headerHeightRefMaps] = useState(() => {
    const handleHeaderHeights = () => {
      if (isActiveRef.current) {
        const headerLabelInnerHeightMap = headerLabelInnerHeightRefMap.current
        const headerMainInnerHeightMap = headerMainInnerHeightRefMap.current
        const heights = []

        // important to loop using 'main' because 'label' might not be tracking height if empty
        for (const [tierNum, mainHeight] of headerMainInnerHeightMap.entries()) {
          heights[tierNum] = Math.max(headerLabelInnerHeightMap.get(tierNum) || 0, mainHeight)
        }

        if (!isArraysEqual(headerTierHeightsRef.current, heights)) {
          setHeaderTierHeights(headerTierHeightsRef.current = heights)
        }
      }
    }
    const headerLabelInnerHeightRefMap = new RefMap<number, number>(() => { // keyed by tierNum
      afterSize(handleHeaderHeights)
    })
    const headerMainInnerHeightRefMap = new RefMap<number, number>(() => { // keyed by tierNum
      afterSize(handleHeaderHeights)
    })
    return { headerLabelInnerHeightRefMap, headerMainInnerHeightRefMap }
  })
  const { headerLabelInnerHeightRefMap, headerMainInnerHeightRefMap } = headerHeightRefMaps

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

  // scrollers
  const headerScrollerRef = useRef<Scroller>(null)
  const allDayScrollerRef = useRef<Scroller>(null)
  const mainScrollerRef = useRef<Scroller>(null)
  const footScrollerRef = useRef<Scroller>(null)
  const axisScrollerRef = useRef<Scroller>(null)
  useScrollerSyncer(
    /* isHorizontal = */ true,
    [headerScrollerRef, allDayScrollerRef, mainScrollerRef, footScrollerRef],
    props.dayScrollerRef,
  )
  useScrollerSyncer(
    /* isHorizontal = */ false,
    // main first: once a scroll ends, the syncer's y reads its first scroller, and only main is sure
    // to be scrollable (the shell checks whether a restored position was reached)
    [mainScrollerRef, axisScrollerRef],
    props.timeScrollerRef,
  )

  const { nowDate, headerTiers, forPrint } = props
  const nowIndicatorDayDate = (!forPrint && context.options.nowIndicator)
    ? computeNowIndicatorDayDate(nowDate, props.nowIndicatorSegsByCol, props.cells)
    : undefined
  const { options } = context
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

  const endScrollbarWidth = (totalWidth != null && clientWidth != null && axisWidth != null)
    ? totalWidth - clientWidth - (axisWidth + 1) // +1 for hardcoded divider!
    : undefined

  const verticalScrolling = !forPrint && !getIsHeightAuto(options)
  const tableHeaderSticky = !forPrint && getTableHeaderSticky(options)
  const footerScrollbarSticky = !forPrint && getFooterScrollbarSticky(options)

  const printStackEnabled = computeTimeGridPrintMode(forPrint, options.eventPrintLayout) === 'stack'

  const absPrint = forPrint && !printStackEnabled
  const simplePrint = forPrint && printStackEnabled

  const { canvasWidth, appliedColWidth, cellIsNarrow, cellIsMicro } = computeDayGridColumns(
    props.cells.length,
    clientWidth,
    props.dayMinWidth,
    options,
  )

  const slatCnt = props.slatMetas.length
  const [slatHeight, slatLiquidHeight] = computeSlatHeight( // TODO: memo?
    verticalScrolling && options.expandRows,
    slatCnt,
    options.slotMinHeight,
    slatInnerHeight,
    clientHeight,
  )
  useSlatHeightReport(slatHeight, props.slatHeightRef)

  // TODO: have computeSlatHeight return?
  const totalSlatHeight = (slatHeight || 0) * slatCnt

  const forcedBodyHeight = absPrint ? totalSlatHeight : undefined

  const rowsNotExpanding = verticalScrolling && !options.expandRows &&
    clientHeight != null && clientHeight > totalSlatHeight

  const firstBodyRowIndex = options.dayHeaders ? headerTiers.length + 1 : 1

  const bottomScrollbarWidth =
    footerScrollbarSticky
      ? stickyBottomScrollbarWidth
      : (bodyHeight != null && clientHeight != null)
        ? (bodyHeight - clientHeight)
        : undefined

  return (
    <>
      {options.dayHeaders && (
        <div
          className={joinClassNames(
            generateClassName(options.tableHeaderClass, {
              isSticky: tableHeaderSticky,
              borderlessX,
              borderlessTop,
              borderlessBottom,
              multiMonthColumns: 0,
            }),
            // See the note in TimeGridLayout about why print doesn't use repeating headers.
            classNames.flexCol,
            tableHeaderSticky && classNames.tableHeaderSticky,
            classNames.z1,
          )}
        >
          <div className={classNames.flexRow}>
            {/* HEADER / labels
            -------------------------------------------------------------------------------------*/}
            <div
              role='rowgroup'
              className={classNames.contentBox}
              style={{ width: axisWidth }}
            >
              {headerTiers.map((rowConfig, tierNum) => (
                <div
                  key={tierNum}
                  role='row'
                  aria-rowindex={tierNum + 1}
                  className={joinClassNames(
                    options.dayHeaderRowClass,
                    classNames.flexRow,
                    classNames.contentBox,
                    classNames.borderlessX,
                    classNames.borderlessTop,
                    tierNum === props.headerTiers.length - 1 && classNames.borderlessBottom,
                  )}
                  style={{
                    height: headerTierHeights[tierNum]
                  }}
                >
                  {(options.weekNumbers && rowConfig.isDateRow) ? (
                    <TimeGridWeekNumber
                      dateProfile={props.dateProfile}
                      innerWidthRef={headerLabelInnerWidthRefMap.createRef(tierNum)}
                      innerHeightRef={headerLabelInnerHeightRefMap.createRef(tierNum)}
                      width={undefined}
                      isLiquid={true}
                      isNarrow={cellIsNarrow}
                    />
                  ) : (
                    <TimeGridAxisEmpty
                      width={undefined}
                      isLiquid={true}
                    />
                  )}
                </div>
              ))}
            </div>
            <div
              className={generateClassName(options.slotHeaderDividerClass, {
                inTableHeader: true,
                options: { dayMinWidth: options.dayMinWidth },
              })}
            />
            {/* HEADER / main (horizontal scroller)
            -------------------------------------------------------------------------------------*/}
            <Scroller
              horizontal
              hideScrollbars
              className={joinClassNames(classNames.flexRow, classNames.liquid)}
              ref={headerScrollerRef}
            >
              {/* TODO: converge with DayGridHeader */}
              <div
                role='rowgroup'
                className={canvasWidth == null ? classNames.liquid : ''}
                style={{ width: canvasWidth }}
              >
                {props.headerTiers.map((rowConfig, tierNum) => (
                  <DayGridHeaderRow
                    {...rowConfig}
                    key={tierNum}
                    role='row'
                    rowIndex={tierNum}
                    borderBottom={tierNum < props.headerTiers.length - 1}
                    height={headerTierHeights[tierNum]}
                    colWidth={appliedColWidth}
                    viewportWidth={clientWidth}
                    innerHeightRef={headerMainInnerHeightRefMap.createRef(tierNum)}
                    cellIsNarrow={cellIsNarrow}
                    cellIsMicro={cellIsMicro}
                    rowLevel={props.headerTiers.length - tierNum - 1}
                  />
                ))}
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
          </div>
          <div
            className={generateClassName(options.dayHeaderDividerClass, {
              isSticky: tableHeaderSticky,
              multiMonthColumns: 0,
              options: { allDaySlot: Boolean(options.allDaySlot) },
            })}
          />
        </div>
      )}
      <div // the "body"
        role='rowgroup'
        className={joinClassNames(
          generateClassName(options.tableBodyClass, {
            borderlessX,
            borderlessTop,
            borderlessBottom,
            multiMonthColumns: 0,
          }),
          classNames.flexCol,
          verticalScrolling && classNames.liquid,
          classNames.isolate,
          classNames.z0,
        )}
      >
        {options.allDaySlot && (
          <>
            <div
              role='row'
              aria-rowindex={firstBodyRowIndex}
              className={joinClassNames(classNames.flexRow, classNames.z1)}
            >
              {/* ALL-DAY / label
              -----------------------------------------------------------------------------------*/}
              <TimeGridAllDayHeader
                width={axisWidth}
                innerWidthRef={allDayLabelInnerWidthRef}
                isNarrow={cellIsNarrow}
              />
              <div
                className={generateClassName(options.slotHeaderDividerClass, {
                  inTableHeader: false,
                  options: { dayMinWidth: options.dayMinWidth },
                })}
              />
              {/* ALL-DAY / main (horizontal scroller)
              -----------------------------------------------------------------------------------*/}
              <Scroller
                horizontal
                hideScrollbars
                // fill remaining width
                className={joinClassNames(classNames.flexRow, classNames.liquidX)}
                ref={allDayScrollerRef}
              >
                <div
                  className={classNames.flexRow}
                  style={{ width: canvasWidth }}
                >
                  <TimeGridAllDayLane
                    dateProfile={props.dateProfile}
                    todayRange={props.todayRange}
                    cells={props.cells}
                    showDayNumbers={false}
                    forPrint={forPrint}
                    isHitComboAllowed={props.isHitComboAllowed}
                    className={joinClassNames(classNames.borderless, classNames.liquidX)}
                    cellIsNarrow={cellIsNarrow}
                    cellIsMicro={cellIsMicro}

                    // content
                    fgEventSegs={props.fgEventSegs}
                    bgEventSegs={props.bgEventSegs}
                    businessHourSegs={props.businessHourSegs}
                    dateSelectionSegs={props.dateSelectionSegs}
                    eventSelection={props.eventSelection}
                    eventDrag={props.eventDrag}
                    eventResize={props.eventResize}
                    dayMaxEvents={props.dayMaxEvents}
                    dayMaxEventRows={props.dayMaxEventRows}

                    // dimensions
                    colWidth={appliedColWidth}
                  />
                </div>
                {Boolean(endScrollbarWidth) && (
                  <div
                    className={joinClassNames(
                      generateClassName(options.fillerClass, { inTableHeader: false }),
                      classNames.borderlessY,
                      classNames.borderlessEnd,
                    )}
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </Scroller>
            </div>
            {/* TODO: don't show div if no classname */}
            <div
              className={joinClassNames(options.allDayDividerClass, classNames.z2)}
            />
          </>
        )}
        <div
          role='row'
          aria-rowindex={firstBodyRowIndex + (options.allDaySlot ? 1 : 0)}
          className={joinClassNames(
            classNames.flexRow,
            classNames.rel, // for Ruler.fillStart
            verticalScrolling && classNames.liquid,
            classNames.z0,
          )}
        >
          {/* SLATS / labels (vertical scroller)
          ---------------------------------------------------------------------------------------*/}
          <Scroller
            vertical={verticalScrolling}
            hideScrollbars
            className={joinClassNames(classNames.flexCol, classNames.contentBox)}
            style={{
              width: axisWidth,
            }}
            ref={axisScrollerRef}
            clientHeightRef={setBodyHeight}
          >
            {!simplePrint && (
              <>
                <div // canvas
                  role='rowheader'
                  className={joinClassNames(
                    classNames.flexCol,
                    classNames.grow,
                    classNames.rel, // for absPrint and TimeGridNowIndicatorArrow
                  )}
                  style={{
                    height: forcedBodyHeight,
                  }}
                >
                  <div className={classNames.srOnly}>{options.timedText}</div>
                  <div // label list
                    aria-hidden
                    className={joinClassNames(
                      classNames.flexCol,
                      (verticalScrolling && options.expandRows) && classNames.grow,
                      absPrint && classNames.fillX,
                    )}
                  >
                    {props.slatMetas.map((slatMeta, slatI) => (
                      <TimeGridSlatHeader
                        {...slatMeta /* FYI doesn't need isoTimeStr */}
                        key={slatMeta.key}
                        innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                        innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                        borderTop={Boolean(slatI)}
                        isNarrow={cellIsNarrow}
                        height={slatLiquidHeight ? undefined : slatHeight}
                        liquidHeight={slatLiquidHeight}
                      />
                    ))}
                  </div>
                  {nowIndicatorDayDate && (
                    <TimeGridNowIndicatorArrow
                      nowDate={nowDate}
                      dayDate={nowIndicatorDayDate}
                      dateProfile={props.dateProfile}
                      totalHeight={slatHeight != null ? slatHeight * slatCnt : undefined}
                    />
                  )}
                  {Boolean(rowsNotExpanding || bottomScrollbarWidth) && (
                    <div
                      className={joinClassNames(
                        generateClassName(options.fillerClass, { inTableHeader: false }),
                        classNames.borderlessX,
                        classNames.borderlessBottom,
                        rowsNotExpanding && classNames.liquid,
                      )}
                      style={{
                        minHeight: bottomScrollbarWidth
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </Scroller>
          <div
            className={generateClassName(options.slotHeaderDividerClass, {
              inTableHeader: false,
              options: { dayMinWidth: options.dayMinWidth },
            })}
          />
          {/* SLATS / main (scroller)
          ---------------------------------------------------------------------------------------*/}
          <div
            // we need this div because it's bad for Scroller to have left/right borders,
            // AND because we need to containt the FooterScrollbar
            className={joinClassNames(classNames.flexCol, classNames.liquid)}
          >
            <Scroller
              vertical={verticalScrolling}
              horizontal
              hideScrollbars={
                footerScrollbarSticky || // also means height:auto, so won't need vertical scrollbars anyway
                forPrint
              }
              className={joinClassNames(
                classNames.flexCol,
                classNames.rel, // for Ruler.fillStart
                verticalScrolling && classNames.liquid,
              )}
              ref={mainScrollerRef}
              clientWidthRef={setClientWidth}
              clientHeightRef={setClientHeight}
            >
              <div // canvas (grows b/c of filler at bottom)
                className={joinClassNames(classNames.flexCol, classNames.grow, classNames.rel)}
                style={{
                  width: canvasWidth,
                  height: forcedBodyHeight,
                }}
              >
                <TimeGridCols
                  dateProfile={props.dateProfile}
                  nowDate={props.nowDate}
                  nowMs={props.nowMs}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  slatCnt={slatCnt}
                  forPrint={forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className={simplePrint ? '' : classNames.fill}

                  // content
                  fgEventSegsByCol={props.fgEventSegsByCol}
                  bgEventSegsByCol={props.bgEventSegsByCol}
                  businessHourSegsByCol={props.businessHourSegsByCol}
                  nowIndicatorSegsByCol={props.nowIndicatorSegsByCol}
                  dateSelectionSegsByCol={props.dateSelectionSegsByCol}
                  eventDragByCol={props.eventDragByCol}
                  eventResizeByCol={props.eventResizeByCol}
                  eventSelection={props.eventSelection}

                  // dimensions
                  colWidth={appliedColWidth}
                  slatHeight={slatHeight}
                  cellIsNarrow={cellIsNarrow}
                  cellIsMicro={cellIsMicro}
                />

                {!simplePrint && (
                  <>
                    <div // slot list
                      aria-hidden
                      className={joinClassNames(
                        classNames.flexCol,
                        (verticalScrolling && options.expandRows) && classNames.grow,
                        absPrint ? classNames.fillX : classNames.rel,
                      )}
                    >
                      {props.slatMetas.map((slatMeta, slatI) => (
                        <div
                          key={slatMeta.key}
                          className={joinClassNames(
                            classNames.flexRow,
                            slatLiquidHeight && classNames.liquid,
                          )}
                          style={{
                            height: slatLiquidHeight ? '' : slatHeight
                          }}
                        >
                          <TimeGridSlatLane
                            {...slatMeta /* FYI doesn't need isoTimeStr */}
                            key={slatMeta.key}
                            borderTop={Boolean(slatI)}
                          />
                        </div>
                      ))}
                    </div>
                    {rowsNotExpanding && (
                      <div
                        className={joinClassNames(
                          generateClassName(options.fillerClass, { inTableHeader: false }),
                          classNames.borderlessX,
                          classNames.borderlessBottom,
                          classNames.liquid,
                        )}
                      />
                    )}
                  </>
                )}
              </div>
            </Scroller>
            {Boolean(footerScrollbarSticky) && (
              <FooterScrollbar
                isSticky
                canvasWidth={canvasWidth}
                scrollerRef={footScrollerRef}
                scrollbarWidthRef={setStickyBottomScrollbarWidth}
              />
            )}
          </div>
        </div>{/* END timed row */}
      </div>{/* END rowgroup */}
      <Ruler widthRef={setTotalWidth} />
    </>
  )
})

const EMPTY_HEIGHTS: number[] = []
