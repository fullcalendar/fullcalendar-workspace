import { DateRange } from '@full-ui/headless-calendar'
import { Slicer } from '../common/slicing-utils'
import { DaySeries } from '../common/day-table/day-series'
import { DayTableModel } from '../common/day-table/model'
import { DayGridRange, buildDayGridRanges } from './DayTableModel'

/*
Premium's resource daygrid and timegrid still slice per resource through these, until they move
onto the day-table pipeline (common/day-table/)
*/

export class DayTableSlicer extends Slicer<DayGridRange, [DayTableModel]> {
  forceDayIfListItem = true

  sliceRange(dateRange: DateRange, dayTableModel: DayTableModel): DayGridRange[] {
    return buildDayGridRanges(dayTableModel.daySeries.sliceRange(dateRange), dayTableModel.colCount)
  }
}

export class DaySeriesSlicer extends Slicer<DayGridRange, [DaySeries]> {
  forceDayIfListItem = true

  sliceRange(dateRange: DateRange, daySeries: DaySeries): DayGridRange[] {
    return buildDayGridRanges(daySeries.sliceRange(dateRange), daySeries.cnt)
  }
}
