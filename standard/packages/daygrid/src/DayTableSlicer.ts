import { DayTableModel, DateRange, Slicer, DayGridRange } from '@fullcalendar/core/internal'

export class DayTableSlicer extends Slicer<DayGridRange, [DayTableModel]> {
  forceDayIfListItem = true

  sliceRange(dateRange: DateRange, dayTableModel: DayTableModel): DayGridRange[] {
    return dayTableModel.sliceRange(dateRange)
  }
}
