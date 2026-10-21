import { BaseComponent } from '../../vdom-util'
import { useMemo } from 'react'
import { ViewProps } from '../../component-util/View'
import { useViewContext } from '../../hooks/useViewContext'
import { useNow } from '../../hooks/useNow'
import { buildDateRowConfigs } from '../../daygrid/header-tier'
import { useDayHeaderFormatter } from '../../daygrid/components/useDayGridViewData'
import { DayGridRange } from '../../daygrid/DayTableModel'
import { PLAIN_KEYING, TIME_GRID_ALL_DAY_LANE, TIME_GRID_TIMED_LANE } from '../../common/day-table/keying'
import { useTimeGridModel } from '../../common/day-table/useDayTableModel'
import { useDayTableSegs, useNowIndicatorSegsByCol } from '../../common/day-table/useDayTableSegs'
import { TimeGridRange } from '../TimeColsSeg'
import { TimeGridLayout } from './TimeGridLayout'
import { useTimedSegsByCol } from './useTimeGridViewData'

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
  const model = useTimeGridModel(dateProfile)
  const { nowDate, nowMs, todayRange } = useNow(options.nowIndicator ? 'minute' : 'day' /* hacky */)
  const colDates = model.headerDates
  const { colCount } = model

  const allDayProps = useDayTableSegs<DayGridRange>(
    props,
    PLAIN_KEYING,
    model,
    TIME_GRID_ALL_DAY_LANE,
    dateProfile,
    options.nextDayThreshold,
    context,
  )
  const timedProps = useDayTableSegs<TimeGridRange>(
    props,
    PLAIN_KEYING,
    model,
    TIME_GRID_TIMED_LANE,
    dateProfile,
    null,
    context,
  )
  const timedSegsByCol = useTimedSegsByCol(timedProps, colCount)
  const nowIndicatorSegsByCol = useNowIndicatorSegsByCol(
    nowDate,
    model,
    PLAIN_KEYING,
    dateProfile,
    options.nextDayThreshold,
    false, // datesAboveResources
    !props.forPrint && Boolean(options.nowIndicator),
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
      cells={model.cols}
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
