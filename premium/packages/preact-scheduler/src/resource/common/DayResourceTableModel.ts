import { CalendarContext, DayTableModel } from '@fullcalendar/preact/protected-api'
import { Resource } from '../structs/resource'
import { AbstractResourceDayTableModel, ResourceDayCol, ResourceDayGroup } from './AbstractResourceDayTableModel'
import { HasEventsByDate } from './per-date-filtering'

/*
dates over resources
*/
export function buildDayResourceTableModel(
  dayTableModel: DayTableModel,
  resources: Resource[],
  context: CalendarContext,
  hasEventsByDate: HasEventsByDate | null = null,
): AbstractResourceDayTableModel {
  let hasMajor = resources.length > 1 && dayTableModel.colCount > 1
  let groups: ResourceDayGroup[] = dayTableModel.headerDates.map((date, dateI) => {
    let cols: ResourceDayCol[] = []

    for (let resourceI = 0; resourceI < resources.length; resourceI += 1) {
      let resource = resources[resourceI]

      if (!hasEventsByDate || hasEventsByDate[dateI][resource.id]) {
        cols.push({
          date,
          dateI,
          resource,
          resourceI,
          isMajor: hasMajor && cols.length === 0,
        })
      }
    }

    if (!cols.length) {
      cols.push({
        date,
        dateI,
        resource: null,
        resourceI: -1,
        isMajor: hasMajor,
      })
    }

    return { date, cols }
  })

  return new AbstractResourceDayTableModel(dayTableModel, resources, groups, true, context)
}
