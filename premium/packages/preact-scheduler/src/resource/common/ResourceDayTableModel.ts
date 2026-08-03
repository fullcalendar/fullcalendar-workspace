import { CalendarContext, DayTableModel } from '@fullcalendar/preact/protected-api'
import { Resource } from '../structs/resource'
import { AbstractResourceDayTableModel, ResourceDayCol, ResourceDayGroup } from './AbstractResourceDayTableModel'
import { HasEventsByDate } from './per-date-filtering'

/*
resources over dates
*/
export function buildResourceDayTableModel(
  dayTableModel: DayTableModel,
  resources: Resource[],
  context: CalendarContext,
  hasEventsByDate: HasEventsByDate | null = null,
): AbstractResourceDayTableModel {
  let hasMajor = resources.length > 1 && dayTableModel.colCount > 1
  let dateHasResource = dayTableModel.headerDates.map(() => false)
  let groups: ResourceDayGroup[] = []

  for (let resourceI = 0; resourceI < resources.length; resourceI += 1) {
    let resource = resources[resourceI]
    let cols: ResourceDayCol[] = []

    for (let dateI = 0; dateI < dayTableModel.headerDates.length; dateI += 1) {
      if (!hasEventsByDate || hasEventsByDate[dateI][resource.id]) {
        cols.push({
          date: dayTableModel.headerDates[dateI],
          dateI,
          resource,
          resourceI,
          isMajor: hasMajor && cols.length === 0,
        })
        dateHasResource[dateI] = true
      }
    }

    if (cols.length) {
      groups.push({ resource, cols })
    }
  }

  if (hasEventsByDate) {
    for (let dateI = 0; dateI < dayTableModel.headerDates.length; dateI += 1) {
      if (!dateHasResource[dateI]) {
        let date = dayTableModel.headerDates[dateI]

        groups.push({
          date,
          cols: [{
            date,
            dateI,
            resource: null,
            resourceI: -1,
            isMajor: hasMajor,
          }],
        })
      }
    }
  }

  return new AbstractResourceDayTableModel(dayTableModel, resources, groups, false, context)
}
