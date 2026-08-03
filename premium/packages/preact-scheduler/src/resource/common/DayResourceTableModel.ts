import { CalendarContext, DayCol, DayTableModel } from '@fullcalendar/preact/protected-api'
import { Resource } from '../structs/resource'
import { AbstractResourceDayTableModel, ResourceDayCol, ResourceDayGroup, buildResourceDayCol } from './AbstractResourceDayTableModel'
import { HasEventsByDate } from './per-date-filtering'

/*
dates over resources
*/
export function buildDayResourceTableModel(
  dayTableModel: DayTableModel | null,
  dayCols: DayCol[],
  resources: Resource[],
  context: CalendarContext,
  hasEventsByDate: HasEventsByDate | null = null,
): AbstractResourceDayTableModel {
  let hasMajor = resources.length > 1 && dayCols.length > 1
  let groups: ResourceDayGroup[] = dayCols.map((dayCol, dateI) => {
    let cols: ResourceDayCol[] = []

    for (let resourceI = 0; resourceI < resources.length; resourceI += 1) {
      let resource = resources[resourceI]

      if (!hasEventsByDate || hasEventsByDate[dateI][resource.id]) {
        cols.push(buildResourceDayCol(
          dayCol,
          dateI,
          resource,
          resourceI,
          hasMajor && cols.length === 0,
          context,
        ))
      }
    }

    if (!cols.length) {
      cols.push(buildResourceDayCol(dayCol, dateI, null, -1, hasMajor, context))
    }

    return { date: dayCol.date, cols }
  })

  return new AbstractResourceDayTableModel(dayCols, dayTableModel, resources, groups, true, context)
}
