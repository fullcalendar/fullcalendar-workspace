import { DayGridRow, DayGridRowProps } from '../../daygrid/components/DayGridRow'
import { computeColFromPosition, getCellEl } from '../../day-table/grid-positions'
import { addDays } from '@full-ui/headless-calendar'
import { Hit } from '../../interactions/hit'
import { memo, useRef, useState } from 'react'
import { useHitTarget } from '../../interactions/useHitTarget'
import { useReportedSize } from '../../layout/useReportedSize'
import { MoreLinkTrigger } from '../../more-link/MoreLinkContainer'
import { resolveDayGridPlacementMode } from '../../daygrid/seg-placement-adapter'
import classNames from '../../styles.module.css'

export interface TimeGridAllDayLaneProps extends DayGridRowProps {
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
}

/*
TimeGrid's all-day row, a DayGridRow registered for hits
*/
export const TimeGridAllDayLane = memo(function TimeGridAllDayLane(props: TimeGridAllDayLaneProps) {
  const [moreLinkHeight, setMoreLinkHeight] = useState<number | undefined>(undefined)
  const rootElRef = useRef<HTMLElement | null>(null)
  const heightRef = useRef<number | null>(null)
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
      const colCount = props.cells.length
      const { col, left, right } = computeColFromPosition(
        positionLeft,
        elWidth,
        props.colWidth,
        colCount,
        isRtl
      )
      const cell = props.cells[col]

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
        getDayEl: () => getCellEl(rootElRef.current, col),
        rect: {
          left,
          right,
          top: 0,
          bottom: heightRef.current,
        },
        layer: 0,
      }
    },
  })

  return (
    <>
      <DayGridRow
        {...props}
        moreLinkHeight={moreLinkHeight}

        /* BAD: these overwrite the props! caller might want to pass them */
        rootElRef={rootElRef}
        heightRef={heightRef} /* ALSO, BAD because it simply watches natural height of row-root-el */
      />
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
