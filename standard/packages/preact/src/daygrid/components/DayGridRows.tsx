import { createElement, memo, useMemo, useRef, useState } from 'react'
import { joinClassNames } from '../../util/html'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { useViewOptions } from '../../hooks/useGranularContexts'
import { useLatest } from '../../hooks/useLatest'
import { useHitTarget } from '../../hooks/useHitTarget'
import { useReportedSize } from '../../hooks/useReportedSize'
import { addDays, DateRange } from '@full-ui/headless-calendar'
import { DateProfile } from '../../DateProfileGenerator'
import { Hit } from '../../interactions/hit'
import { DayTableCell, DayGridRange } from '../DayTableModel'
import { RefMap } from '../../util/RefMap'
import { getIsHeightAuto } from '../../scrollgrid/util'
import { EventRangeProps } from '../../component-util/event-rendering'
import { ViewOptionsRefined } from '../../options'
import { splitSegsByRow, splitInteractionByRow } from '../TableSeg'
import { DayGridRow } from './DayGridRow'
import { computeColFromPosition, computeRowFromPosition, getCellEl, getRowEl } from './util'
import classNames from '../../styles.module.css'
import { MoreLinkTrigger } from '../../common/MoreLinkContainer'
import { resolveDayGridPlacementMode } from '../seg-placement-adapter'

export interface DayGridRowsProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  tableMode?: boolean // real table markup, unlike print-rendered TimeGrid all-day rows
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className?: string

  dayMaxEvents?: number | boolean
  dayMaxEventRows?: number | boolean
  // NOTE: the forPrint prop is a bit muddled in meaning

  // content
  fgEventSegs: (DayGridRange & EventRangeProps)[]
  bgEventSegs: (DayGridRange & EventRangeProps)[]
  businessHourSegs: (DayGridRange & EventRangeProps)[]
  dateSelectionSegs: (DayGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<DayGridRange> | null
  eventResize: EventSegUiInteractionState<DayGridRange> | null
  eventSelection: string

  // dimensions
  colWidth?: number // enforced only by fixed/pannable layouts
  width?: number | string // a CSS value
  visibleWidth?: number // for row min-height
  cellIsNarrow: boolean
  cellIsMicro: boolean

  // refs
  rowHeightRefMap?: RefMap<string, number>
}

export const DayGridRows = memo(function DayGridRows(props: DayGridRowsProps) {
  let options = useViewOptions()
  let { cellRows, tableMode } = props
  let rowCount = cellRows.length
  let [moreLinkHeight, setMoreLinkHeight] = useState<number | undefined>(undefined)
  let rootElRef = useRef<HTMLElement | null>(null)

  // HACKy way of syncing RefMap results with prop
  let latestRowHeightRefMapRef = useLatest(props.rowHeightRefMap)
  let [rowHeightRefMap] = useState(() => new RefMap<string, number>((height, key) => {
    latestRowHeightRefMapRef.current?.handleValue(height, key)
  }))

  // Will cause rows to not be reused across months
  let firstCellKey = cellRows[0]?.[0]?.key || ''

  let fgEventSegsByRow = useMemo(() => splitSegsByRow(props.fgEventSegs, rowCount), [props.fgEventSegs, rowCount])
  let bgEventSegsByRow = useMemo(() => splitAllDaySegsByRow(props.bgEventSegs, rowCount), [props.bgEventSegs, rowCount])
  let businessHourSegsByRow = useMemo(
    () => splitSegsByRow(props.businessHourSegs, rowCount),
    [props.businessHourSegs, rowCount],
  )
  let dateSelectionSegsByRow = useMemo(
    () => splitSegsByRow(props.dateSelectionSegs, rowCount),
    [props.dateSelectionSegs, rowCount],
  )
  let eventDragByRow = useMemo(() => splitInteractionByRow(props.eventDrag, rowCount), [props.eventDrag, rowCount])
  let eventResizeByRow = useMemo(() => splitInteractionByRow(props.eventResize, rowCount), [props.eventResize, rowCount])

  let isHeightAuto = getIsHeightAuto(options)
  let rowHeightsRedistribute = !props.forPrint && !isHeightAuto

  let rowBasis = computeRowBasis(
    props.visibleWidth,
    rowCount,
    isHeightAuto,
    options,
  )

  const needsMoreLinkProbe = !props.forPrint && resolveDayGridPlacementMode(
    props.dayMaxEvents,
    props.dayMaxEventRows,
  ) === 'auto'
  const moreLinkElRef = useReportedSize({
    watchHeight: true,
    onSize(_width, height) {
      setMoreLinkHeight(height)
    },
  })

  useHitTarget(rootElRef, {
    isHitComboAllowed: props.isHitComboAllowed,
    eventSelection: props.eventSelection,
    eventDrag: props.eventDrag,
    eventResize: props.eventResize,
    queryHit(isRtl, positionLeft, positionTop, elWidth): Hit | null {
      const colCount = props.cellRows[0].length
      const { col, left, right } = computeColFromPosition(
        positionLeft,
        elWidth,
        props.colWidth,
        colCount,
        isRtl,
      )
      const { row, top, bottom } = computeRowFromPosition(
        positionTop,
        props.cellRows,
        rowHeightRefMap.current,
      )
      const cell = props.cellRows[row][col]

      if (cell.isInert) {
        return null
      }

      const cellStartDate = cell.date
      const cellEndDate = addDays(cellStartDate, 1)

      return {
        dateProfile: props.dateProfile,
        dateSpan: {
          range: {
            start: cellStartDate,
            end: cellEndDate,
          },
          allDay: true,
          ...cell.dateSpanProps,
        },
        getDayEl: () => getCellEl(getRowEl(rootElRef.current, row), col),
        rect: {
          left,
          right,
          top,
          bottom,
        },
        layer: 0,
      }
    },
  })

  return (
    <>
      {createElement(
        tableMode ? 'tbody' : 'div',
        {
          role: 'rowgroup',
          className: joinClassNames(
            props.className,
            // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
            // https://stackoverflow.com/a/60256345
            !tableMode && !props.forPrint && classNames.flexCol,
          ),
          style: tableMode ? undefined : { width: props.width },
          ref: rootElRef,
        },
        cellRows.map((cells, row) => (
          <DayGridRow
            key={firstCellKey + ':' + cells[0].key}
            role="row"
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cells={cells}
            cellIsNarrow={props.cellIsNarrow}
            cellIsMicro={props.cellIsMicro}
            showDayNumbers={rowCount > 1}
            showWeekNumbers={rowCount > 1 && options.weekNumbers}
            forPrint={props.forPrint}
            tableMode={tableMode}
            borderBottom={row < rowCount - 1}

            // if not auto-height, distribute height of container somewhat evently to rows
            className={rowHeightsRedistribute ? classNames.grow : undefined}

            // content
            fgEventSegs={fgEventSegsByRow[row]}
            bgEventSegs={bgEventSegsByRow[row]}
            businessHourSegs={businessHourSegsByRow[row]}
            dateSelectionSegs={dateSelectionSegsByRow[row]}
            eventSelection={props.eventSelection}
            eventDrag={eventDragByRow[row]}
            eventResize={eventResizeByRow[row]}
            dayMaxEvents={props.dayMaxEvents}
            dayMaxEventRows={props.dayMaxEventRows}

            // dimensions
            colWidth={props.colWidth}
            basis={rowBasis}
            moreLinkHeight={moreLinkHeight}

            // refs
            heightRef={rowHeightRefMap.createRef(cells[0].key)}
          />
        )),
      )}
      {/* Intrinsic width: row more-link height must not depend on text wrapping. */}
      {needsMoreLinkProbe && (
        <MoreLinkTrigger
          num={1}
          display='row'
          isNarrow={props.cellIsNarrow}
          isMicro={props.cellIsMicro}
          elRef={moreLinkElRef}
          className={classNames.offscreen}
          attrs={PROBE_ATTRS}
        />
      )}
    </>
  )
})

const PROBE_ATTRS = {
  'aria-hidden': true, // redundant with .offscreen's visibility, but marks it as a probe
}

// Utils
// -------------------------------------------------------------------------------------------------

function isSegAllDay(seg: EventRangeProps): boolean {
  return seg.eventRange.def.allDay
}

function splitAllDaySegsByRow<S extends DayGridRange & EventRangeProps>(segs: S[], rowCnt: number): S[][] {
  return splitSegsByRow(segs.filter(isSegAllDay), rowCnt)
}

/*
Amount of height a row should consume prior to expanding
We don't want to use min-height with flexbox because we leverage min-height:auto,
which yields value based on natural height of events
*/
export function computeRowBasis(
  visibleWidth: number | undefined, // should INCLUDE any scrollbar width to avoid oscillation
  rowCount: number,
  isHeightAuto: boolean,
  options: ViewOptionsRefined,
): number {
  if (visibleWidth != null) {
    // ensure a consistent row min-height modelled after a month with 6 rows respecting aspectRatio
    // will result in same minHeight regardless of weekends, dayMinWidth, height:auto
    const rowBasis = visibleWidth / options.aspectRatio / 6

    // don't give minHeight when single-month non-auto-height
    // TODO: better way to detect this with DateProfile?
    return (rowCount > 6 || isHeightAuto) ? rowBasis : 0
  }

  return 0
}
