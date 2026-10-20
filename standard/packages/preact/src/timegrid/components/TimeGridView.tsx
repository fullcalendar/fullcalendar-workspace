import { BaseComponent } from '../../vdom-util'
import { useMemo, useState } from 'react'
import { ViewProps } from '../../component-util/View'
import { useViewContext } from '../../hooks/useViewContext'
import { buildDateRowConfigs } from '../../daygrid/header-tier'
import { useDayHeaderFormatter } from '../../daygrid/components/useDayGridViewData'
import { DaySeriesSlicer } from '../../daygrid/DayTableSlicer'
import { DayTimeColsSlicer } from '../DayTimeColsSlicer'
import { organizeSegsByCol } from '../TimeColsSeg'
import { TimeGridLayout } from './TimeGridLayout'
import { useTimedSegsByCol, useTimeGridViewData } from './useTimeGridViewData'

// a class, because a view's component must be one (see parseViewConfig)
export class TimeGridView extends BaseComponent<ViewProps> {
  render() {
    return <TimeGridViewBody {...this.props} />
  }
}

function TimeGridViewBody(props: ViewProps) {
  const context = useViewContext()
  const { options } = context
  const { dateProfile } = props
  const { daySeries, dayCols, dayRanges, splitProps, nowDate, nowMs, todayRange } = useTimeGridViewData(props)
  const colDates = useMemo(() => dayCols.map((col) => col.date), [dayCols])
  const colCount = dayCols.length

  const [daySeriesSlicer] = useState(() => new DaySeriesSlicer())
  const [dayTimeColsSlicer] = useState(() => new DayTimeColsSlicer())
  const allDayProps = daySeriesSlicer.sliceProps(
    splitProps.allDay,
    dateProfile,
    options.nextDayThreshold,
    context,
    daySeries,
  )
  const timedProps = dayTimeColsSlicer.sliceProps(
    splitProps.timed,
    dateProfile,
    null,
    context,
    dayRanges,
  )
  const timedSegsByCol = useTimedSegsByCol(timedProps, colCount)

  const nowIndicatorSeg = !props.forPrint && options.nowIndicator &&
    dayTimeColsSlicer.sliceNowDate(nowDate, dateProfile, options.nextDayThreshold, context, dayRanges)
  const nowIndicatorSegsByCol = useMemo(
    () => organizeSegsByCol(nowIndicatorSeg || null, colCount),
    [nowIndicatorSeg, colCount],
  )

  const dayHeaderFormat = useDayHeaderFormatter(true /* datesRepDistinctDays */, colCount)
  const headerTiers = useMemo(
    () => buildDateRowConfigs(
      colDates,
      true, // datesRepDistinctDays
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
    ),
    [colDates, dateProfile, todayRange, dayHeaderFormat, context],
  )

  return (
    <TimeGridLayout
      labelId={props.labelId}
      labelStr={props.labelStr}

      dateProfile={dateProfile}
      nowDate={nowDate}
      nowMs={nowMs}
      todayRange={todayRange}
      cells={dayCols}
      forPrint={props.forPrint}
      className={props.className}

      // header content
      headerTiers={headerTiers}

      // all-day content
      fgEventSegs={allDayProps.fgEventSegs}
      bgEventSegs={allDayProps.bgEventSegs}
      businessHourSegs={allDayProps.businessHourSegs}
      dateSelectionSegs={allDayProps.dateSelectionSegs}
      eventDrag={allDayProps.eventDrag}
      eventResize={allDayProps.eventResize}

      // timed content
      {...timedSegsByCol}
      nowIndicatorSegsByCol={nowIndicatorSegsByCol}

      // universal content
      eventSelection={props.eventSelection}
    />
  )
}
