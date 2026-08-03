import { Duration } from '@fullcalendar/preact/public-api'
import {
  DateEnv, DateProfile, DateProfileGenerator, DateRange, DaySeriesModel,
  EventDefHash, EventInstanceHash, EventStore,
  addDays, computeVisibleDayRange, filterHash, intersectRanges, memoize, rangesIntersect,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from '../structs/resource'

/*
Utilities for filterResourcesWithEvents. Each view owns a ResourceFilter, which builds one
FilterRanges and runs the view-wide pass (which resources appear at all). Single-row
multi-day vertical views then feed that same FilterRanges to computeHasEventsByDate for the
per-date pass (which (date, resource) columns exist), so both passes see identical windows.
*/

/*
these options all have base defaults, so they're always present at runtime despite the
optional typing (which lets refined view-options objects be passed directly)
*/
export interface EventFilterOptions {
  filterResourcesWithEvents?: boolean
  slotMinTime?: Duration
  slotMaxTime?: Duration
  nextDayThreshold?: Duration
}

/*
The rendered window of each visible day, in the same order as the view's day columns. A
null entry is a date that renders nothing (clipped away by activeRange) and can never own
events; entries stay in place rather than being dropped so per-date consumers can index by
date-column.
*/
export interface FilterRanges {
  timed: (DateRange | null)[] // for timed event instances
  allDay: (DateRange | null)[] // for all-day event instances, which render on civil days
  nextDayThreshold: Duration | null // when set, normalize timed instances like the renderers do
}

/*
Owns a view's filterResourcesWithEvents memoization. Returns the filtered store plus the
ranges it filtered against — null when the option is off, which also serves as the
per-date pass's "no filtering" signal.
*/
export class ResourceFilter {
  private buildFilterRanges = memoize(buildFilterRanges)
  private filterResourceStore = memoize(filterResourceStore)

  filter(
    resourceStore: ResourceHash,
    eventStore: EventStore,
    dateProfile: DateProfile,
    options: EventFilterOptions,
    dateEnv: DateEnv,
    dateProfileGenerator: DateProfileGenerator,
  ): { resourceStore: ResourceHash, filterRanges: FilterRanges | null } {
    if (!options.filterResourcesWithEvents) {
      return { resourceStore, filterRanges: null }
    }

    let filterRanges = this.buildFilterRanges(dateProfile, options, dateEnv, dateProfileGenerator)

    return {
      resourceStore: this.filterResourceStore(resourceStore, eventStore, filterRanges),
      filterRanges,
    }
  }
}

/*
Builds per-visible-day ranges so filtering matches what actually renders: hidden days
excluded, ranges clipped to activeRange (so events on validRange-disabled dates don't
retain resources). usesMinMaxTime can be a per-config predicate (timeline's whole-day
axes ignore slotMinTime/slotMaxTime, so filtering must too); when true, timed instances
test against slot windows. Otherwise civil-day views (daygrid, whole-day timeline axes)
render timed events on nextDayThreshold-normalized days, so filtering tests the same.
*/
function buildFilterRanges(
  dateProfile: DateProfile,
  options: EventFilterOptions,
  dateEnv: DateEnv,
  dateProfileGenerator: DateProfileGenerator,
): FilterRanges {
  let { activeRange } = dateProfile
  let usesSlotWindow = dateProfileGenerator.computeUsesMinMaxTime(dateProfile.currentRange)
  let daySeries = new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator)
  let timed: (DateRange | null)[] = []
  let allDay: (DateRange | null)[] = []

  for (let date of daySeries.dates) {
    let allDayRange = intersectRanges({ start: date, end: addDays(date, 1) }, activeRange)
    let timedRange = usesSlotWindow
      ? intersectRanges(
          { start: dateEnv.add(date, options.slotMinTime!), end: dateEnv.add(date, options.slotMaxTime!) },
          activeRange,
        )
      : allDayRange

    allDay.push(allDayRange)
    timed.push(timedRange)
  }

  return { timed, allDay, nextDayThreshold: usesSlotWindow ? null : options.nextDayThreshold || null }
}

function filterResourceStore(
  resourceStore: ResourceHash,
  eventStore: EventStore,
  filterRanges: FilterRanges,
): ResourceHash {
  let instancesInRange = filterEventInstancesInRanges(eventStore.instances, eventStore.defs, filterRanges)
  let hasEvents = computeHasEvents(instancesInRange, eventStore.defs)

  Object.assign(hasEvents, computeAncestorHasEvents(hasEvents, resourceStore))

  return filterHash(resourceStore, (resource, resourceId) => hasEvents[resourceId])
}

function filterEventInstancesInRanges(
  eventInstances: EventInstanceHash,
  eventDefs: EventDefHash,
  filterRanges: FilterRanges,
) {
  return filterHash(eventInstances, (eventInstance) => {
    let { allDay } = eventDefs[eventInstance.defId]
    let range = normalizeInstanceRange(eventInstance.range, allDay, filterRanges)
    let ranges = allDay ? filterRanges.allDay : filterRanges.timed

    return ranges.some((filterRange) => filterRange && rangesIntersect(range, filterRange))
  })
}

/*
timed instances render on nextDayThreshold-normalized days in civil-day views, so they must
be tested that way too
*/
function normalizeInstanceRange(range: DateRange, allDay: boolean, filterRanges: FilterRanges): DateRange {
  return (!allDay && filterRanges.nextDayThreshold)
    ? computeVisibleDayRange(range, filterRanges.nextDayThreshold) as DateRange
    : range
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
The per-date refinement of filterResourceStore: same ranges, same store, but recorded per
date-column instead of collapsed. Requires the caller's day columns to line up with
filterRanges, which holds for the single-row multi-day views that use this.
*/
export function computeHasEventsByDate(
  eventStore: EventStore,
  resourceStore: ResourceHash,
  filterRanges: FilterRanges,
): HasEventsByDate {
  let hasEventsByDate: HasEventsByDate = filterRanges.timed.map(() => ({}))

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]
    let def = eventStore.defs[instance.defId]
    let dayRanges = def.allDay ? filterRanges.allDay : filterRanges.timed
    let range = normalizeInstanceRange(instance.range, def.allDay, filterRanges)

    for (let dateI = 0; dateI < dayRanges.length; dateI += 1) {
      if (dayRanges[dateI] && rangesIntersect(range, dayRanges[dateI])) {
        let hasEvents = hasEventsByDate[dateI]

        for (let resourceId of def.resourceIds) {
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
