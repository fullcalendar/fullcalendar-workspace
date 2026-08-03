import { CalendarContext, DayTableModel } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel, ResourceDayCol } from './AbstractResourceDayTableModel'

/*
TODO: move this so @fullcalendar/resource-daygrid
*/
export function buildResourcelessDayTableModel(
  dayTableModel: DayTableModel,
  context: CalendarContext,
): AbstractResourceDayTableModel {
  let cols: ResourceDayCol[] = dayTableModel.headerDates.map((date, dateI) => ({
    date,
    dateI,
    resource: null,
    resourceI: -1,
    isMajor: dayTableModel.cellRows[0][dateI].isMajor,
  }))

  return new AbstractResourceDayTableModel(dayTableModel, [], [{ cols }], false, context)
}
