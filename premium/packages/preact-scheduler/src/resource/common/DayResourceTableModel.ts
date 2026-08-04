import { CalendarContext, DayCol, DayTableModel } from '@fullcalendar/preact/protected-api'
import { Resource } from '../structs/resource'
import { AbstractResourceDayTableModel, ResourceDayCol, ResourceDayGroup, buildResourceDayCol } from './AbstractResourceDayTableModel'
import { HasEventsByDate } from './resource-filtering'

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
  let groups: ResourceDayGroup[] = []

  for (let dateI = 0; dateI < dayCols.length; dateI += 1) {
    let dayCol = dayCols[dateI]
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

    // a date on which no resource has events is omitted WHOLESALE — no header cell, no
    // column, the neighbouring dates simply sit adjacent. intentional (a filtered view never
    // mixes resource columns with bare day columns); day-only rendering happens only via the
    // resourceless model, and then covers every date
    if (cols.length) {
      groups.push({ date: dayCol.date, cols })
    }
  }

  return new AbstractResourceDayTableModel(dayCols, dayTableModel, resources, groups, true, context)
}
