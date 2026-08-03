import { DateRange, EventStore, rangesIntersect } from '@fullcalendar/preact/protected-api'
import { ResourceHash } from '../structs/resource'

export type HasEventsByDate = { [resourceId: string]: true }[]

export function computeHasEventsByDate(
  eventStore: EventStore,
  resourceStore: ResourceHash,
  dayRanges: DateRange[],
): HasEventsByDate {
  let hasEventsByDate: HasEventsByDate = dayRanges.map(() => ({}))

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]
    let resourceIds = eventStore.defs[instance.defId].resourceIds

    for (let dateI = 0; dateI < dayRanges.length; dateI += 1) {
      if (rangesIntersect(instance.range, dayRanges[dateI])) {
        let hasEvents = hasEventsByDate[dateI]

        for (let resourceId of resourceIds) {
          hasEvents[resourceId] = true
        }
      }
    }
  }

  for (let hasEvents of hasEventsByDate) {
    for (let resourceId in hasEvents) {
      let resource

      while ((resource = resourceStore[resourceId])) {
        resourceId = resource.parentId

        if (resourceId) {
          hasEvents[resourceId] = true
        } else {
          break
        }
      }
    }
  }

  return hasEventsByDate
}
