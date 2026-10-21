import { DateFormatter, DateRange } from '@full-ui/headless-calendar'
import { useMemo } from 'react'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { useViewOptions } from '../../context/useGranularContexts'
import { useNow } from '../../now/useNow'
import { DayTableModel } from '../../day-table/model'
import { useDayGridModel } from '../../day-table/useDayTableModel'
import { createDayHeaderFormatter } from './util'

export interface DayGridViewData {
  dayTableModel: DayTableModel
  datesRepDistinctDays: boolean // one row, so each column is one date
  todayRange: DateRange
}

/*
What the DayGrid views (DayGridView, ResourceDayGridView) derive the same way: the day table, and
today, which updates at midnight
*/
export function useDayGridViewData(dateProfile: DateProfile): DayGridViewData {
  const dayTableModel = useDayGridModel(dateProfile)
  const { todayRange } = useNow('day')

  return {
    dayTableModel,
    datesRepDistinctDays: dayTableModel.rowCount === 1,
    todayRange,
  }
}

export function useDayHeaderFormatter(datesRepDistinctDays: boolean, colCount: number): DateFormatter {
  const options = useViewOptions()

  return useMemo(
    () => createDayHeaderFormatter(options.dayHeaderFormat, datesRepDistinctDays, colCount),
    [options.dayHeaderFormat, datesRepDistinctDays, colCount],
  )
}
