import { CalendarContext, DayCol, DayTableModel } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel, ResourceDayCol, buildResourceDayCol } from './AbstractResourceDayTableModel'

/*
TODO: move this so @fullcalendar/resource-daygrid
*/
export function buildResourcelessDayTableModel(
  dayTableModel: DayTableModel | null,
  dayCols: DayCol[],
  context: CalendarContext,
): AbstractResourceDayTableModel {
  let cols: ResourceDayCol[] = dayCols.map((dayCol, dateI) => (
    buildResourceDayCol(dayCol, dateI, null, -1, dayCol.isMajor, context)
  ))

  return new AbstractResourceDayTableModel(dayCols, dayTableModel, [], [{ cols }], false, context)
}
