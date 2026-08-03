import { Duration } from '@fullcalendar/preact/public-api'
import {
  DateEnv, DateProfile, DateProfileGenerator, DateRange, DaySeriesModel,
  EventDefHash, EventInstanceHash, EventStore,
  addDays, computeVisibleDayRange, filterHash, intersectRanges, rangesIntersect,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from '../structs/resource'

/*
Utilities for filterResourcesWithEvents. Each view applies its own filtering:
buildFilterRanges + filterResourceStore for the view-wide pass (which resources appear at
all), and computeHasEventsByDate for the per-date pass (which (date, resource) columns
exist in single-row multi-day vertical views).
*/

/*
these options all have base defaults, so they're always present at runtime despite the
optional typing (which lets refined view-options objects be passed directly)
*/
export interface EventFilterOptions {
  slotMinTime?: Duration
  slotMaxTime?: Duration
  nextDayThreshold?: Duration
}

export interface FilterRanges {
  timed: DateRange[] // for timed event instances
  allDay: DateRange[] // for all-day event instances, which render on civil days
  nextDayThreshold: Duration | null // when set, normalize timed instances like the renderers do
}

/*
Builds per-visible-day ranges so filtering matches what actually renders: hidden days
excluded, ranges clipped to activeRange (so events on validRange-disabled dates don't
retain resources). usesMinMaxTime can be a per-config predicate (timeline's whole-day
axes ignore slotMinTime/slotMaxTime, so filtering must too); when true, timed instances
test against slot windows. Otherwise civil-day views (daygrid, whole-day timeline axes)
render timed events on nextDayThreshold-normalized days, so filtering tests the same.
*/
export function buildFilterRanges(
  dateProfile: DateProfile,
  options: EventFilterOptions,
  dateEnv: DateEnv,
  dateProfileGenerator: DateProfileGenerator,
): FilterRanges {
  let { activeRange } = dateProfile
  let usesSlotWindow = dateProfileGenerator.computeUsesMinMaxTime(dateProfile.currentRange)
  let daySeries = new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator)
  let timed: DateRange[] = []
  let allDay: DateRange[] = []

  for (let date of daySeries.dates) {
    let allDayRange = intersectRanges({ start: date, end: addDays(date, 1) }, activeRange)
    let timedRange = usesSlotWindow
      ? intersectRanges(
          { start: dateEnv.add(date, options.slotMinTime!), end: dateEnv.add(date, options.slotMaxTime!) },
          activeRange,
        )
      : allDayRange

    if (timedRange) {
      timed.push(timedRange as DateRange)
    }
    if (allDayRange) {
      allDay.push(allDayRange as DateRange)
    }
  }

  return { timed, allDay, nextDayThreshold: usesSlotWindow ? null : options.nextDayThreshold || null }
}

export function filterResourceStore(
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
    let def = eventDefs[eventInstance.defId]
    let range = (!def.allDay && filterRanges.nextDayThreshold)
      ? computeVisibleDayRange(eventInstance.range, filterRanges.nextDayThreshold) as DateRange
      : eventInstance.range
    let ranges = def.allDay ? filterRanges.allDay : filterRanges.timed

    return ranges.some((filterRange) => rangesIntersect(range, filterRange))
  })
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
Range lists are indexed by date-col. A null entry means the date is disabled (outside
activeRange) and can never own events. Timed event instances test against timedDayRanges
and all-day instances against allDayDayRanges, mirroring how the renderers slice each
type. nextDayThreshold, when given, normalizes timed instances the way daygrid
rendering does.
*/
export function computeHasEventsByDate(
  eventStore: EventStore,
  resourceStore: ResourceHash,
  timedDayRanges: (DateRange | null)[],
  allDayDayRanges: (DateRange | null)[],
  nextDayThreshold: Duration | null = null,
): HasEventsByDate {
  let hasEventsByDate: HasEventsByDate = timedDayRanges.map(() => ({}))

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]
    let def = eventStore.defs[instance.defId]
    let dayRanges = def.allDay ? allDayDayRanges : timedDayRanges
    let range = (!def.allDay && nextDayThreshold)
      ? computeVisibleDayRange(instance.range, nextDayThreshold) as DateRange
      : instance.range

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
