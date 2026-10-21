import { DateMarker, DateRange } from '@full-ui/headless-calendar'
import { useMemo, useState } from 'react'
import { DaySeries } from '../../common/day-table/day-series'
import { DayCol } from '../../common/day-cols'
import { useTimeGridModel } from '../../common/day-table/useDayTableModel'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { EventRangeProps } from '../../component-util/event-rendering'
import { ViewProps } from '../../component-util/View'
import { SplittableProps } from '../../component-util/event-splitting'
import { useViewContext } from '../../hooks/useViewContext'
import { useNow } from '../../hooks/useNow'
import { AllDaySplitter } from '../AllDaySplitter'
import { organizeSegsByCol, splitInteractionByCol, TimeGridRange } from '../TimeColsSeg'

export interface TimeGridViewData {
  daySeries: DaySeries
  dayCols: DayCol[]
  dayRanges: DateRange[]
  splitProps: { [key: string]: SplittableProps } // the view's props, by allDay and timed
  nowDate: DateMarker // to the minute with the now indicator, otherwise the day
  nowMs: number
  todayRange: DateRange
}

/*
What ResourceTimeGridView derives: the day columns, the props split into all-day and timed, and now.
TimeGridView is on the day-table pipeline (useTimeGridModel, useDayTableSegs) instead
*/
export function useTimeGridViewData(props: ViewProps): TimeGridViewData {
  const { options } = useViewContext()
  const { daySeries, dayCols } = useTimeGridModel(props.dateProfile)
  const dayRanges = useMemo(() => dayCols.map((dayCol) => dayCol.range), [dayCols])

  const [allDaySplitter] = useState(() => new AllDaySplitter())
  const splitProps = allDaySplitter.splitProps(props)

  const { nowDate, nowMs, todayRange } = useNow(options.nowIndicator ? 'minute' : 'day' /* hacky */)

  return { daySeries, dayCols, dayRanges, splitProps, nowDate, nowMs, todayRange }
}

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
