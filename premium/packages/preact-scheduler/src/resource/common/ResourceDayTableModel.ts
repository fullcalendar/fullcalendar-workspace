import { CalendarContext, DayCol, DayTableModel } from '@fullcalendar/preact/protected-api'
import { Resource } from '../structs/resource'
import { AbstractResourceDayTableModel, ResourceDayCol, ResourceDayGroup, buildResourceDayCol } from './AbstractResourceDayTableModel'
import { HasEventsByDate } from './per-date-filtering'

/*
resources over dates
*/
export function buildResourceDayTableModel(
  dayTableModel: DayTableModel | null,
  dayCols: DayCol[],
  resources: Resource[],
  context: CalendarContext,
  hasEventsByDate: HasEventsByDate | null = null,
): AbstractResourceDayTableModel {
  let hasMajor = resources.length > 1 && dayCols.length > 1
  let groups: ResourceDayGroup[] = []

  for (let resourceI = 0; resourceI < resources.length; resourceI += 1) {
    let resource = resources[resourceI]
    let cols: ResourceDayCol[] = []

    for (let dateI = 0; dateI < dayCols.length; dateI += 1) {
      if (!hasEventsByDate || hasEventsByDate[dateI][resource.id]) {
        cols.push(buildResourceDayCol(
          dayCols[dateI],
          dateI,
          resource,
          resourceI,
          hasMajor && cols.length === 0,
          context,
        ))
      }
    }

    if (cols.length) {
      groups.push({ resource, cols })
    }
  }

  return new AbstractResourceDayTableModel(dayCols, dayTableModel, resources, groups, false, context)
}
