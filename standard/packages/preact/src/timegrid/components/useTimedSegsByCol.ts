import { useMemo } from 'react'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { EventRangeProps } from '../../component-util/event-rendering'
import { organizeSegsByCol, splitInteractionByCol, TimeGridRange } from '../TimeColsSeg'

export interface TimedSegs {
  fgEventSegs: (TimeGridRange & EventRangeProps)[]
  bgEventSegs: (TimeGridRange & EventRangeProps)[]
  businessHourSegs: (TimeGridRange & EventRangeProps)[]
  dateSelectionSegs: (TimeGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<TimeGridRange> | null
  eventResize: EventSegUiInteractionState<TimeGridRange> | null
}

export interface TimedSegsByCol {
  fgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  bgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  businessHourSegsByCol: (TimeGridRange & EventRangeProps)[][]
  dateSelectionSegsByCol: (TimeGridRange & EventRangeProps)[][]
  eventDragByCol: EventSegUiInteractionState<TimeGridRange>[]
  eventResizeByCol: EventSegUiInteractionState<TimeGridRange>[]
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
