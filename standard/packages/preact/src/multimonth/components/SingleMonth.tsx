import { CssDimValue } from '../../scrollgrid/util'
import { joinClassNames } from '../../util/html'
import { buildNavLinkAttrs } from '../../common/nav-link'
import { DateFormatter, DateRange, joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import { generateClassName } from '../../common/render-hook'
import { RefMap } from '../../util/RefMap'
import { Ruler } from '../../scrollgrid/Ruler'
import { ViewProps } from '../../component-util/View'
import classNames from '../../styles.module.css'
import { memo, useMemo, useState } from 'react'
import { useViewContext } from '../../hooks/useViewContext'
import { useRenderHookEl } from '../../hooks/useRenderHookEl'
import { useReportedSize } from '../../hooks/useReportedSize'
import { useMeasuredState } from '../../hooks/useMeasuredState'
import { buildDateRowConfig } from '../../daygrid/header-tier'
import { buildDayTableModel, computeDayGridColumns, createDayHeaderFormatter } from '../../daygrid/components/util'
import { DayGridRows } from '../../daygrid/components/DayGridRows'
import { DayTableSlicer } from '../../daygrid/DayTableSlicer'
import { DayGridHeaderRow } from '../../daygrid/components/DayGridHeaderRow'
import { computeViewBorderless } from '../../util/misc'
import { SingleMonthInfo, SingleMonthHeaderInfo } from '../structs'
import { DayGridLayoutPrint } from '../../daygrid/components/DayGridLayoutPrint'

export interface SingleMonthProps extends ViewProps {
  todayRange: DateRange
  isoDateStr?: string
  titleFormat: DateFormatter
  width?: CssDimValue
  colCount?: number // # of MONTHS, not day columns
  isFirst: boolean
  isLast: boolean
  hasLateralSiblings: boolean // TODO: use lower-level indicator instead of referencing siblings
}

/*
One month of MultiMonth: a title, a day header and day rows
*/
export const SingleMonth = memo(function SingleMonth(props: SingleMonthProps) {
  const context = useViewContext()
  const { dateProfile, forPrint } = props
  const { options, dateEnv } = context
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)
  const titleId = context.baseId + 'month-' + props.isoDateStr

  const dayTableModel = useMemo(
    () => buildDayTableModel(dateProfile, context.dateProfileGenerator, dateEnv),
    [dateProfile, context.dateProfileGenerator, dateEnv],
  )
  const [slicer] = useState(() => new DayTableSlicer())
  const slicedProps = slicer.sliceProps(props, dateProfile, options.nextDayThreshold, context, dayTableModel)

  const dayHeaderFormat = useMemo(
    () => createDayHeaderFormatter(
      options.dayHeaderFormat,
      false, // datesRepDistinctDays
      dayTableModel.colCount,
    ),
    [options.dayHeaderFormat, dayTableModel.colCount],
  )
  const rowConfig = useMemo(
    () => buildDateRowConfig(
      dayTableModel.headerDates,
      false, // datesRepDistinctDays
      dateProfile,
      props.todayRange,
      dayHeaderFormat,
      context,
    ),
    [dayTableModel.headerDates, dateProfile, props.todayRange, dayHeaderFormat, context],
  )

  // the month's element, with its singleMonth* render hooks
  const renderProps = useMemo<SingleMonthInfo>(() => ({
    isFirst: props.isFirst,
    isLast: props.isLast,
    multiMonthColumns: props.colCount || 0,
  }), [props.isFirst, props.isLast, props.colCount])
  const renderHookEl = useRenderHookEl({
    classGenerator: options.singleMonthClass,
    didMount: options.singleMonthDidMount,
    willUnmount: options.singleMonthWillUnmount,
    renderProps,
  })

  // measurements
  const [gridWidth, setGridWidth] = useMeasuredState()
  const [titleHeight, setTitleHeight] = useState<number | undefined>(undefined)
  const [tableHeaderHeight, setTableHeaderHeight] = useState<number | undefined>(undefined)
  const handleTitleEl = useReportedSize({
    watchHeight: true,
    onSize(_width, height) {
      setTitleHeight(height)
    },
  })
  const handleTableHeaderEl = useReportedSize({
    watchHeight: true,
    onSize(_width, height) {
      setTableHeaderHeight(height)
    },
  })
  const [rowHeightRefMap] = useState(() => new RefMap<string, number>())

  const isTitleAndHeaderSticky = !forPrint && props.colCount === 1
  const isAspectRatio = !forPrint || props.hasLateralSiblings

  const { cellIsNarrow, cellIsMicro } = computeDayGridColumns(
    dayTableModel.cellRows[0].length,
    gridWidth,
    undefined,
    options,
  )

  const rowHeightGuess = gridWidth != null
    ? (1 / options.aspectRatio) * gridWidth / 6
    : undefined

  const headerStickyBottom = isTitleAndHeaderSticky
    ? rowHeightGuess
    : undefined

  const titleStickyBottom = isTitleAndHeaderSticky && rowHeightGuess != null && tableHeaderHeight != null
    ? rowHeightGuess + tableHeaderHeight + 1
    : undefined
  const businessHourSegs = slicedProps.businessHourSegs
  const dateSelectionSegs = forPrint ? [] : slicedProps.dateSelectionSegs
  const eventDrag = forPrint ? null : slicedProps.eventDrag
  const eventResize = forPrint ? null : slicedProps.eventResize
  const tableMode = forPrint && !props.hasLateralSiblings

  const hasNavLink = options.navLinks && props.colCount > 1
  const headerRenderProps: SingleMonthHeaderInfo = {
    multiMonthColumns: props.colCount || 0,
    isSticky: isTitleAndHeaderSticky,
    isNarrow: cellIsNarrow,
    hasNavLink,
  }
  const monthStartDate = props.dateProfile.currentRange.start
  const navLinkAttrs: any = hasNavLink
    ? buildNavLinkAttrs(
      context,
      monthStartDate,
      'month',
      props.isoDateStr,
    )
    : {}

  return (
    <div // TODO: move this to the parent component?
      role='listitem'
      style={{ width: props.width }}
    >
      <div
        role='table'
        aria-labelledby={titleId}
        data-date={props.isoDateStr}
        ref={renderHookEl.ref}
        className={joinClassNames(
          renderHookEl.className,
          classNames.flexCol,
          props.hasLateralSiblings && classNames.breakInsideAvoid,
        )}
      >
        <Ruler widthRef={setGridWidth} />
        <div
          id={titleId}
          ref={handleTitleEl}
          className={joinClassNames(
            generateClassName(options.singleMonthHeaderClass, headerRenderProps),
            isTitleAndHeaderSticky && classNames.stickyT,
            isTitleAndHeaderSticky && classNames.z3,
            classNames.flexCol,
          )}
          style={{
            // HACK to keep zIndex above table-header,
            // because in Chrome, something about position:sticky on this title div
            // causes its bottom border to no be considered part of its mass,
            // and would get overlapped and hidden by the table-header div
            marginBottom: titleStickyBottom,
          }}
        >
          <div
            {...navLinkAttrs}
            className={joinClassNames(
              generateClassName(options.singleMonthHeaderInnerClass, headerRenderProps),
              navLinkAttrs.className,
            )}
          >
            {joinDateTimeFormatParts(dateEnv.formatToParts(monthStartDate, props.titleFormat))}
          </div>
        </div>
        {tableMode ? (
          <DayGridLayoutPrint
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={dayTableModel.cellRows}
            headerTiers={[rowConfig]}
            showHeader
            headerElRef={handleTableHeaderEl}
            fgEventSegs={slicedProps.fgEventSegs}
            bgEventSegs={slicedProps.bgEventSegs}
            businessHourSegs={businessHourSegs}
            eventSelection={slicedProps.eventSelection}
            dayMaxEventRows
            borderlessX={borderlessX}
            borderlessTop={borderlessTop}
            borderlessBottom={borderlessBottom}
            multiMonthColumns={props.colCount || 0}
            visibleWidth={gridWidth}
            cellIsNarrow={cellIsNarrow}
            cellIsMicro={cellIsMicro}
            rowHeightRefMap={rowHeightRefMap}
            style={{
              marginTop: titleStickyBottom != null ? -titleStickyBottom : undefined,
            }}
          />
        ) : (
          <div // the daygrid table
            className={joinClassNames(
              generateClassName(options.tableClass, {
                borderlessX,
                borderlessTop,
                borderlessBottom,
                multiMonthColumns: props.colCount || 0,
              }),
              classNames.flexCol,
            )}
            style={{
              marginTop: titleStickyBottom != null ? -titleStickyBottom : undefined,
            }}
          >
            <div
              ref={handleTableHeaderEl}
              className={joinClassNames(
                generateClassName(options.tableHeaderClass, {
                  isSticky: isTitleAndHeaderSticky,
                  borderlessX,
                  borderlessTop,
                  borderlessBottom,
                  multiMonthColumns: props.colCount || 0,
                }),
                classNames.flexCol,
                isTitleAndHeaderSticky && classNames.sticky,
                isTitleAndHeaderSticky && classNames.z2,
              )}
              style={{
                top: isTitleAndHeaderSticky ? titleHeight : 0,
                marginBottom: headerStickyBottom,
              }}
            >
              <DayGridHeaderRow
                {...rowConfig}
                role='row'
                borderBottom={false}
                cellIsNarrow={cellIsNarrow}
                cellIsMicro={cellIsMicro}
                rowLevel={0}
              />
              <div
                className={generateClassName(options.dayHeaderDividerClass, {
                  isSticky: isTitleAndHeaderSticky,
                  multiMonthColumns: props.colCount || 0,
                  options: { allDaySlot: Boolean(options.allDaySlot) },
                })}
              />
            </div>
            <div
              className={joinClassNames(
                generateClassName(options.tableBodyClass, {
                  borderlessX,
                  borderlessTop,
                  borderlessBottom,
                  multiMonthColumns: props.colCount || 0,
                }),
                classNames.flexCol,
                isAspectRatio && classNames.rel,
                isTitleAndHeaderSticky && classNames.z1,
              )}
              style={{
                marginTop: headerStickyBottom != null ? -headerStickyBottom : undefined,
                aspectRatio: isAspectRatio ? String(options.aspectRatio) : undefined,
              }}
            >
              <DayGridRows
                dateProfile={props.dateProfile}
                todayRange={props.todayRange}
                cellRows={dayTableModel.cellRows}
                className={isAspectRatio ? classNames.fill : ''}
                forPrint={forPrint && !props.hasLateralSiblings}
                dayMaxEventRows={
                  (forPrint && props.hasLateralSiblings)
                    ? 1 // for side-by-side multimonths, limit to one row
                    : true // otherwise, always do +more link, never expand rows
                }

                // content
                fgEventSegs={slicedProps.fgEventSegs}
                bgEventSegs={slicedProps.bgEventSegs}
                businessHourSegs={businessHourSegs}
                dateSelectionSegs={dateSelectionSegs}
                eventDrag={eventDrag}
                eventResize={eventResize}
                eventSelection={slicedProps.eventSelection}

                // dimensions
                visibleWidth={gridWidth}
                cellIsNarrow={cellIsNarrow}
                cellIsMicro={cellIsMicro}
                rowHeightRefMap={rowHeightRefMap}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
