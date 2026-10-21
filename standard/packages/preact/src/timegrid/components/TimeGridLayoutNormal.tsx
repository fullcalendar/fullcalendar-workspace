import { joinClassNames } from '../../util/html'
import { DateMarker, DateRange } from '@full-ui/headless-calendar'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { DayTableCell } from '../../day-table/day-grid-range'
import { EventRangeProps } from '../../event-segs/event-ranges'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { generateClassName } from '../../render-hook/render-hook-types'
import { getIsHeightAuto, getTableHeaderSticky } from '../../scrollgrid/layout-options'
import { Hit } from '../../interactions/hit'
import { Ruler } from '../../scrollgrid/Ruler'
import { Scroller } from '../../scrollgrid/Scroller'
import { ScrollerInterface } from '../../scrollgrid/scroller-types'
import { SlicedCoordRange } from '../../event-segs/coord-range'
import { memo, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { useViewOptions } from '../../context/useGranularContexts'
import { useMeasuredState } from '../../layout/useMeasuredState'
import classNames from '../../styles.module.css'
import { DayGridHeaderRow } from '../../daygrid/components/DayGridHeaderRow'
import { computeDayGridColumns } from '../../daygrid/components/column-sizing'
import { RowConfig } from '../../daygrid/header-tier'
import { TimeSlatMeta } from "../time-slat-meta"
import { TimeGridRange } from "../../day-table/time-grid-range"
import { TimeGridAllDayHeader } from "./TimeGridAllDayHeader"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane"
import { TimeGridAxisEmpty } from "./TimeGridAxisEmpty"
import { TimeGridCols } from "./TimeGridCols"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow"
import { TimeGridSlatHeader } from "./TimeGridSlatHeader"
import { TimeGridSlatLane } from "./TimeGridSlatLane"
import { TimeGridWeekNumber } from "./TimeGridWeekNumber"
import { computeSlatHeight, computeNowIndicatorDayDate } from './time-geometry'
import { computeTimeGridPrintMode } from '../print-mode'
import { computeViewBorderless } from '../../views/view-borderless'
import { useSlatHeightReport, useTimeGridAxis } from './useTimeGridAxis'

export interface TimeGridLayoutNormalProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  nowMs?: number
  todayRange: DateRange
  cells: DayTableCell[]
  slatMetas: TimeSlatMeta[],
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
  timeScrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>
}

/*
The TimeGrid layout without dayMinWidth: one vertical scroller, with the axis inside it
*/
export const TimeGridLayoutNormal = memo(function TimeGridLayoutNormal(props: TimeGridLayoutNormalProps) {
  const options = useViewOptions()
  const {
    axisWidth,
    slatInnerHeight,
    allDayLabelInnerWidthRef,
    headerLabelInnerWidthRefMap,
    slatLabelInnerWidthRefMap,
    slatLabelInnerHeightRefMap,
  } = useTimeGridAxis()
  const [totalWidth, setTotalWidth] = useState<number | undefined>(undefined)
  const [clientWidth, setClientWidth] = useMeasuredState()
  const [clientHeight, setClientHeight] = useMeasuredState()
  const isActiveRef = useRef(false)
  const [handleTotalWidth] = useState(() => (totalWidth: number | null) => {
    if (totalWidth == null) { // unmounting. see useMeasuredState
      return
    }

    // Must delay the rerender because might change the width of the all-day DayGridRow events,
    // which shows a ResizeObserver loop warning
    requestAnimationFrame(() => {
      if (isActiveRef.current) {
        setTotalWidth(totalWidth)
      }
    })
  })

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

  const { nowDate, forPrint } = props
  const nowIndicatorDayDate = (!forPrint && options.nowIndicator)
    ? computeNowIndicatorDayDate(nowDate, props.nowIndicatorSegsByCol, props.cells)
    : undefined
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

  const endScrollbarWidth = (totalWidth != null && clientWidth != null && !forPrint)
    ? totalWidth - clientWidth
    : undefined

  const verticalScrolling = !forPrint && !getIsHeightAuto(options)
  const tableHeaderSticky = !forPrint && getTableHeaderSticky(options)

  const slatCnt = props.slatMetas.length
  const [slatHeight, slatLiquidHeight] = computeSlatHeight(
    verticalScrolling && options.expandRows,
    slatCnt,
    options.slotMinHeight,
    slatInnerHeight,
    clientHeight,
  )
  useSlatHeightReport(slatHeight, props.slatHeightRef)

  // TODO: have computeSlatHeight return?
  const totalSlatHeight = (slatHeight || 0) * slatCnt

  const rowsNotExpanding = verticalScrolling && !options.expandRows &&
    clientHeight != null && clientHeight > totalSlatHeight

  const printStackEnabled = computeTimeGridPrintMode(forPrint, options.eventPrintLayout) === 'stack'

  const absPrint = forPrint && !printStackEnabled
  const simplePrint = forPrint && printStackEnabled

  // for printing
  // in Chrome, slats and columns both need abs positioning within a relative container for them
  // to sync across pages, and the relative container needs an explicit height
  // in Firefox, same applies, but the flex-row for the cells has trouble spanning across page,
  // so we need to set explicit height on flex-row and all parents
  const forcedBodyHeight = absPrint ? totalSlatHeight : undefined

  const { cellIsNarrow, cellIsMicro } = computeDayGridColumns(props.cells.length, clientWidth, undefined, options)

  return (
    <>
      {/* HEADER
      ---------------------------------------------------------------------------------------*/}
      {options.dayHeaders && (
        <div
          role='rowgroup'
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
          {props.headerTiers.map((rowConfig, tierNum) => (
            <div
              key={tierNum}
              role='row'
              className={classNames.flexRow}
            >
              <div
                className={joinClassNames(
                  options.dayHeaderRowClass,
                  classNames.flexRow,
                  classNames.borderlessX,
                  classNames.borderlessTop,
                  tierNum === props.headerTiers.length - 1 && classNames.borderlessBottom,
                )}
              >
                {(options.weekNumbers && rowConfig.isDateRow) ? (
                  <TimeGridWeekNumber
                    dateProfile={props.dateProfile}
                    innerWidthRef={headerLabelInnerWidthRefMap.createRef(tierNum)}
                    width={axisWidth}
                    isLiquid={false}
                    isNarrow={cellIsNarrow}
                  />
                ) : (
                  <TimeGridAxisEmpty
                    width={axisWidth}
                    isLiquid={false}
                  />
                )}
              </div>
              <div
                className={generateClassName(options.slotHeaderDividerClass, {
                  inTableHeader: true,
                  options: { dayMinWidth: options.dayMinWidth },
                })}
              />
              <DayGridHeaderRow
                {...rowConfig}
                className={classNames.liquid}
                borderBottom={tierNum < props.headerTiers.length - 1}
                viewportWidth={clientWidth}
                cellIsNarrow={cellIsNarrow}
                cellIsMicro={cellIsMicro}
                rowLevel={props.headerTiers.length - tierNum - 1}
              />
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
            </div>
          ))}
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
        {/* ALL-DAY
        ---------------------------------------------------------------------------------------*/}
        {options.allDaySlot && (
          <>
            <div
              role='row'
              className={joinClassNames(classNames.flexRow, classNames.z1)}
            >
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
              <TimeGridAllDayLane
                dateProfile={props.dateProfile}
                todayRange={props.todayRange}
                cells={props.cells}
                showDayNumbers={false}
                forPrint={forPrint}
                isHitComboAllowed={props.isHitComboAllowed}
                className={joinClassNames(classNames.liquidX, classNames.borderless)}
                cellIsNarrow={cellIsNarrow}
                cellIsMicro={cellIsMicro}
                // content
                fgEventSegs={props.fgEventSegs}
                bgEventSegs={props.bgEventSegs}
                businessHourSegs={props.businessHourSegs}
                dateSelectionSegs={props.dateSelectionSegs}
                eventDrag={props.eventDrag}
                eventResize={props.eventResize}
                eventSelection={props.eventSelection}
                dayMaxEvents={props.dayMaxEvents}
                dayMaxEventRows={props.dayMaxEventRows}
              />
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
            </div>
            {/* TODO: don't show div if no classname */}
            <div
              className={joinClassNames(options.allDayDividerClass, classNames.z2)}
            />
          </>
        )}
        {/* SLATS
        -----------------------------------------------------------------------------------------*/}
        <Scroller
          vertical={verticalScrolling}
          className={joinClassNames(
            classNames.flexCol,
            classNames.rel, // for Ruler.fillStart
            verticalScrolling && classNames.liquid,
            classNames.z0,
          )}
          ref={props.timeScrollerRef as any} // HACK
          clientWidthRef={setClientWidth}
          clientHeightRef={setClientHeight}
        >
          <div // canvas (grows b/c of filler at bottom)
            className={joinClassNames(
              classNames.flexCol,
              classNames.grow,
              classNames.rel,
            )}
            style={{
              // in print mode, this div creates the height and everything is absolutely positioned within
              // we need to do this so that slats positioning synces with events's positioning
              // otherwise, get out of sync on second page
              height: forcedBodyHeight,
            }}
          >
            <div
              role='row'
              className={joinClassNames(
                classNames.flexRow,
                !simplePrint && classNames.fill,
              )}
            >
              <div
                role='rowheader'
                className={classNames.contentBox}
                style={{ width: axisWidth }}
              >
                <div className={classNames.srOnly}>{options.timedText}</div>
              </div>
              <div
                className={generateClassName(options.slotHeaderDividerClass, {
                  inTableHeader: false,
                  options: { dayMinWidth: options.dayMinWidth },
                })}
              />
              <TimeGridCols
                dateProfile={props.dateProfile}
                nowDate={props.nowDate}
                nowMs={props.nowMs}
                todayRange={props.todayRange}
                cells={props.cells}
                slatCnt={slatCnt}
                forPrint={forPrint}
                isHitComboAllowed={props.isHitComboAllowed}
                className={classNames.liquid}

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
                slatHeight={slatHeight}
                cellIsNarrow={cellIsNarrow}
                cellIsMicro={cellIsMicro}
              />
            </div>

            {!simplePrint && (
              <>
                <div
                  aria-hidden
                  className={joinClassNames(
                    classNames.flexCol,
                    (verticalScrolling && options.expandRows) && classNames.grow,
                    absPrint
                      ? classNames.fillX // will assume top:0, height will be decided naturally
                      : classNames.rel, // needs abs/rel for zIndex
                  )}
                >
                  {props.slatMetas.map((slatMeta, slatI) => (
                    <div
                      key={slatMeta.key}
                      className={joinClassNames(
                        slatLiquidHeight && classNames.liquid,
                        classNames.flexRow,
                      )}
                      style={{
                        height: slatLiquidHeight ? undefined : slatHeight
                      }}
                    >
                      <div
                        // the pannable version of TimeGrid has axis labels all consecutive in one column
                        // simulate this for the non-pannable version
                        className={classNames.flexCol}
                        style={{ width: axisWidth }}
                      >
                        <TimeGridSlatHeader
                          {...slatMeta /* FYI doesn't need isoTimeStr */}
                          key={slatMeta.key}
                          innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                          innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                          borderTop={Boolean(slatI)}
                          isNarrow={cellIsNarrow}
                        />
                      </div>
                      <div
                        className={generateClassName(options.slotHeaderDividerClass, {
                          inTableHeader: false,
                          options: { dayMinWidth: options.dayMinWidth },
                        })}
                        style={{ visibility: 'hidden' }}
                        // ^TODO: className?
                        // invisible because dayLanes show the line
                      />
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

                {nowIndicatorDayDate && (
                  <TimeGridNowIndicatorArrow
                    nowDate={nowDate}
                    dayDate={nowIndicatorDayDate}
                    dateProfile={props.dateProfile}
                    totalHeight={slatHeight != null ? slatHeight * slatCnt : undefined}
                  />
                )}
              </>
            )}
          </div>
        </Scroller>
      </div>
      <Ruler widthRef={handleTotalWidth} />
    </>
  )
})
