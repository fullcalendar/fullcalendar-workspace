import { createViewComponent } from '../../views/view-config'
import { useMemo } from 'react'
import { ViewProps } from '../../views/view-props'
import { useViewContext } from '../../context/useViewContext'
import { PLAIN_KEYING, DAY_GRID_LANE } from '../../day-table/keying'
import { useDayTableSegs } from '../../day-table/useDayTableSegs'
import { DayGridRange } from '../../day-table/day-grid-range'
import { buildDateRowConfigs } from '../../day-table/header-tier'
import { DayGridLayout } from './DayGridLayout'
import { useDayGridViewData, useDayHeaderFormatter } from './useDayGridViewData'

// memoized on its props, and marked as a view (see createViewComponent)
export const DayGridView = createViewComponent(DayGridViewBody)

function DayGridViewBody(props: ViewProps) {
  const context = useViewContext()
  const { options } = context
  const { dateProfile } = props
  const { dayTableModel, datesRepDistinctDays, todayRange } = useDayGridViewData(dateProfile)
  const dayHeaderFormat = useDayHeaderFormatter(datesRepDistinctDays, dayTableModel.colCount)
  const slicedProps = useDayTableSegs<DayGridRange>(
    props,
    PLAIN_KEYING,
    dayTableModel,
    DAY_GRID_LANE,
    dateProfile,
    options.nextDayThreshold,
    context,
  )
  const headerTiers = useMemo(
    () => buildDateRowConfigs(
      dayTableModel.headerDates,
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
    ),
    [dayTableModel.headerDates, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context],
  )

  return (
    <DayGridLayout
      labelId={props.labelId}
      labelStr={props.labelStr}
      dateProfile={dateProfile}
      todayRange={todayRange}
      cellRows={dayTableModel.cellRows}
      forPrint={props.forPrint}
      className={props.className}

      // header content
      headerTiers={headerTiers}

      // body content
      fgEventSegs={slicedProps.fgEventSegs}
      bgEventSegs={slicedProps.bgEventSegs}
      businessHourSegs={slicedProps.businessHourSegs}
      dateSelectionSegs={slicedProps.dateSelectionSegs}
      eventDrag={slicedProps.eventDrag}
      eventResize={slicedProps.eventResize}
      eventSelection={slicedProps.eventSelection}
    />
  )
}
