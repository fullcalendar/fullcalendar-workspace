import { Duration } from '@fullcalendar/preact/public-api'
import {
  DateRange, DayCol, EventDefHash, EventInstanceHash, EventStore,
  addDays, computeVisibleDayRange, filterHash, rangesIntersect,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from '../structs/resource'

/*
Utilities for filterResourcesWithEvents.

View-wide (filterResourceStore, applied by each view for itself): a resource is shown when
any of its events intersect the view's activeRange — ONE contiguous span.

That coarseness is deliberate, not an oversight. The rule does not care whether an event
lands on an invisible period INSIDE the span — an interior hidden day, or a gap outside
slotMinTime/slotMaxTime — so such a resource is still shown, with a visibly empty column or
row. Tightening this to "must fall on something actually rendered" was built and then
reverted: every view family renders its span differently (timeline slots can be coarser than
a day and paint the hidden days inside them; a whole-day timeline axis ignores slot times
entirely), so a per-day rule silently deleted events that really did render. Treat the empty
column as the accepted cost and leave the rule alone.

Per-date (computeHasEventsByDate): the same intersection test asked once per rendered
column, so multi-day vertical views can give a (date, resource) pair its own column. Being
per-column makes it strictly finer than the view-wide pass, so a resource can survive
view-wide and match no column at all; buildResourceTableModel falls back to day-only columns
when that happens for every resource.

KNOWN LIMITATION, predating this code and intentionally left alone: an event counts via its
raw range even when it renders something else. Chiefly display:'inverse-background', which
paints the COMPLEMENT of its range. Mirroring the inverse would mark every date the event
does NOT cover, which effectively disables filtering for any resource carrying availability
shading — worse than the current wart. A real fix excludes inverse-background and
display:'none' outright, resolving display through compileEventUis (event/source/global
levels), not def.ui alone.
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

Column ranges are used as-is, NOT clipped to activeRange. A date disabled by validRange can
therefore take a column for a resource that has events elsewhere in the view. Accepted: that
column renders (disabled, empty) in an unfiltered view too, so filtering isn't inventing it.
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
