import { Duration } from '@fullcalendar/preact/public-api'
import {
  DateRange, DayCol, EventDefHash, EventInstanceHash, EventStore,
  addDays, computeVisibleDayRange, filterHash, rangesIntersect,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from '../structs/resource'

/*
Utilities for filterResourcesWithEvents.

View-wide (filterResourceStore, applied by each view for itself): a resource is shown when
any of its events intersect the view's activeRange — one contiguous span, deliberately
indifferent to invisible periods inside it (hidden days, gaps outside
slotMinTime/slotMaxTime).

Per-date (computeHasEventsByDate): the same intersection test asked once per rendered
column, so multi-day vertical views can give a (date, resource) pair its own column. Being
per-column makes it strictly finer than the view-wide pass, so a resource can survive
view-wide and still match no column — callers fall back to a day-only model when nothing
matches at all.
*/

export function filterResourceStore(
  resourceStore: ResourceHash,
  doFilterResourcesWithEvents: boolean,
  eventStore: EventStore,
  activeRange: DateRange,
): ResourceHash {
  if (!doFilterResourcesWithEvents) {
    return resourceStore
  }

  let instancesInRange = filterEventInstancesInRange(eventStore.instances, activeRange)
  let hasEvents = computeHasEvents(instancesInRange, eventStore.defs)

  Object.assign(hasEvents, computeAncestorHasEvents(hasEvents, resourceStore))

  return filterHash(resourceStore, (resource, resourceId) => hasEvents[resourceId])
}

function filterEventInstancesInRange(eventInstances: EventInstanceHash, activeRange: DateRange) {
  return filterHash(eventInstances, (eventInstance) => rangesIntersect(eventInstance.range, activeRange))
}

function computeHasEvents(eventInstances: EventInstanceHash, eventDefs: EventDefHash) {
  let hasEvents = {}

  for (let instanceId in eventInstances) {
    let instance = eventInstances[instanceId]

    for (let resourceId of eventDefs[instance.defId].resourceIds) {
      hasEvents[resourceId] = true
    }
  }

  return hasEvents
}

/*
mark resources as having events if any of their ancestors have them
NOTE: resourceStore might not have all the resources that hasEvents{} has keyed
*/
function computeAncestorHasEvents(hasEvents: { [resourceId: string]: boolean }, resourceStore: ResourceHash) {
  let res = {}

  for (let resourceId in hasEvents) {
    let resource

    while ((resource = resourceStore[resourceId])) {
      resourceId = resource.parentId // now functioning as the parentId

      if (resourceId) {
        res[resourceId] = true
      } else {
        break
      }
    }
  }

  return res
}

/* per-date filtering */

export type HasEventsByDate = { [resourceId: string]: true }[]

/*
An event earns a column when it intersects that column's range — the same test as above,
just asked per column instead of once.

Two wrinkles, both about WHICH column an event renders in rather than about narrowing the
window. All-day events render in the all-day row, on civil days, not inside a column's slot
range; those coincide until slotMaxTime runs past midnight (or slotMinTime goes negative),
at which point a column overlaps its neighbour's day and an all-day event there would earn a
column that renders nothing. And daygrid slices timed events with nextDayThreshold, so
matching must too.
*/
export function computeHasEventsByDate(
  eventStore: EventStore,
  resourceStore: ResourceHash,
  dayCols: DayCol[],
  nextDayThreshold: Duration | null = null,
): HasEventsByDate {
  let hasEventsByDate: HasEventsByDate = dayCols.map(() => ({}))
  let civilDayRanges = dayCols.map((dayCol) => ({
    start: dayCol.date,
    end: addDays(dayCol.date, 1),
  }))

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]
    let { allDay, resourceIds } = eventStore.defs[instance.defId]
    let range = (!allDay && nextDayThreshold)
      ? computeVisibleDayRange(instance.range, nextDayThreshold) as DateRange
      : instance.range

    for (let dateI = 0; dateI < dayCols.length; dateI += 1) {
      if (rangesIntersect(range, allDay ? civilDayRanges[dateI] : dayCols[dateI].range)) {
        let hasEvents = hasEventsByDate[dateI]

        for (let resourceId of resourceIds) {
          hasEvents[resourceId] = true
        }
      }
    }
  }

  for (let hasEvents of hasEventsByDate) {
    Object.assign(hasEvents, computeAncestorHasEvents(hasEvents, resourceStore))
  }

  return hasEventsByDate
}
