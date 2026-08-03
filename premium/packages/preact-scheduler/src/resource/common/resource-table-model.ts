import { CalendarContext, DayCol, DayTableModel } from '@fullcalendar/preact/protected-api'
import { Resource } from '../structs/resource'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel'
import { buildDayResourceTableModel } from './DayResourceTableModel'
import { buildResourceDayTableModel } from './ResourceDayTableModel'
import { buildResourcelessDayTableModel } from './ResourcelessDayTableModel'
import { HasEventsByDate } from './resource-filtering'

/*
TODO: kill this and DayResourceTableModel/ResourceDayTableModel/ResourcelessDayTableModel,
which differ only in column ordering and presence
*/
export function buildResourceTableModel(
  dayTableModel: DayTableModel | null, // only for multi-row daygrid
  dayCols: DayCol[],
  resources: Resource[],
  datesAboveResources: boolean,
  hasEventsByDate: HasEventsByDate | null,
  context: CalendarContext,
): AbstractResourceDayTableModel {
  if (!resources.length) {
    return buildResourcelessDayTableModel(dayTableModel, dayCols, context)
  }

  return datesAboveResources ?
    buildDayResourceTableModel(dayTableModel, dayCols, resources, context, hasEventsByDate) :
    buildResourceDayTableModel(dayTableModel, dayCols, resources, context, hasEventsByDate)
}
