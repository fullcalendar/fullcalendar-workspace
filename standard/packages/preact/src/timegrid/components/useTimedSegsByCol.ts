import { useMemo } from 'react'
import { SlicedEventInteraction } from '../../interactions/event-interaction-state'
import { EventRangeProps } from '../../event-segs/event-ranges'
import { organizeSegsByCol, splitInteractionByCol, TimeGridRange } from '../../day-table/time-grid-range'

export interface TimedSegs {
  fgEventSegs: (TimeGridRange & EventRangeProps)[]
  bgEventSegs: (TimeGridRange & EventRangeProps)[]
  businessHourSegs: (TimeGridRange & EventRangeProps)[]
  dateSelectionSegs: (TimeGridRange & EventRangeProps)[]
  eventDrag: SlicedEventInteraction<TimeGridRange> | null
  eventResize: SlicedEventInteraction<TimeGridRange> | null
}

export interface TimedSegsByCol {
  fgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  bgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  businessHourSegsByCol: (TimeGridRange & EventRangeProps)[][]
  dateSelectionSegsByCol: (TimeGridRange & EventRangeProps)[][]
  eventDragByCol: SlicedEventInteraction<TimeGridRange>[]
  eventResizeByCol: SlicedEventInteraction<TimeGridRange>[]
}

// the timed segs, by column
export function useTimedSegsByCol(timed: TimedSegs, colCount: number): TimedSegsByCol {
  return {
    fgEventSegsByCol: useMemo(() => organizeSegsByCol(timed.fgEventSegs, colCount), [timed.fgEventSegs, colCount]),
    bgEventSegsByCol: useMemo(() => organizeSegsByCol(timed.bgEventSegs, colCount), [timed.bgEventSegs, colCount]),
    businessHourSegsByCol: useMemo(
      () => organizeSegsByCol(timed.businessHourSegs, colCount),
      [timed.businessHourSegs, colCount],
    ),
    dateSelectionSegsByCol: useMemo(
      () => organizeSegsByCol(timed.dateSelectionSegs, colCount),
      [timed.dateSelectionSegs, colCount],
    ),
    eventDragByCol: useMemo(() => splitInteractionByCol(timed.eventDrag, colCount), [timed.eventDrag, colCount]),
    eventResizeByCol: useMemo(() => splitInteractionByCol(timed.eventResize, colCount), [timed.eventResize, colCount]),
  }
}
