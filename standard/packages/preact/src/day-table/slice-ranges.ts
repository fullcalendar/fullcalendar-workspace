import { DateRange, Duration, addDays, intersectRanges } from '@full-ui/headless-calendar'
import { EventStore, createEmptyEventStore } from '../events/event-store'
import { EventDef, EventDefHash } from '../events/event-def'
import { EventInstanceHash } from '../events/event-instance'
import { DateSpan, fabricateEventRange } from '../events/date-span'
import { expandRecurring } from '../events/recurring-event'
import { EventUiHash } from '../events/event-ui'
import {
  EventRangeProps,
  EventRenderRange,
  EventSliceState,
  compileEventUi,
  createEventSliceState,
  emitInverseComplements,
  initEventSliceDef,
  sliceEventInstance,
  sliceEventStore,
} from '../event-segs/event-ranges'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { SlicedEventInteraction } from '../interactions/event-interaction-state'
import { DateProfile } from '../date-profile/DateProfileGenerator'
import { CalendarContext } from '../context/CalendarContext'
import { DayGridRange, buildDayGridRanges } from './day-grid-range'
import { TimeGridRange } from './time-grid-range'
import { computeActiveRange } from '../event-segs/Slicer'
import { DayCol } from './model'
import { DaySeries } from './day-series'
import { DayTableLane, isDefInLane } from './keying'

/*
Stage 1 of the day-table pipeline: slicing per key, in the PLAIN date coordinates (the model's
daySeries and dayCols, never its view columns). Stage 2 (project.ts) puts the results onto the
view columns. Each function mirrors a Slicer method (common/slicing-utils.ts) and produces the
same segs; the hook caches them per key.
*/

export type DayTableRange = DayGridRange | TimeGridRange
export type DayTableSeg = DayTableRange & EventRangeProps

export interface DayTableEventSegs {
  fg: DayTableSeg[]
  bg: DayTableSeg[]
}

const EMPTY_EVENT_STORE = createEmptyEventStore()

/*
Foreground and background events for the given keys, in one pass over the store, in
sliceEventStore's three stages: defs (UIs, inverse-background groups), instances in store order,
then the inverse complements. Equivalent to sliceEventStore on each key's subset of the store
*/
export function sliceDayTableEvents(
  eventStore: EventStore,
  keys: string[],
  eventUiBasesByKey: { [key: string]: EventUiHash },
  keysForEventDef: (def: EventDef) => string[],
  daySeries: DaySeries,
  dayCols: DayCol[],
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
): { [key: string]: DayTableEventSegs } {
  let res: { [key: string]: DayTableEventSegs } = {}

  if (!eventStore) {
    for (let key of keys) {
      res[key] = { fg: [], bg: [] }
    }

    return res
  }

  let { defs, instances } = eventStore
  let framingRange = computeActiveRange(dateProfile, Boolean(nextDayThreshold))
  let states: { [key: string]: EventSliceState } = {}
  let keysByDefId: { [defId: string]: string[] } = {}

  for (let key of keys) {
    states[key] = createEventSliceState()
  }

  for (let defId in defs) {
    let def = defs[defId]

    if (isDefInLane(def, lane)) {
      let defKeys = filterRequestedKeys(keysForEventDef(def), states)

      keysByDefId[defId] = defKeys

      for (let key of defKeys) {
        initEventSliceDef(def, compileEventUi(def, eventUiBasesByKey[key]), states[key])
      }
    }
  }

  for (let instanceId in instances) {
    let instance = instances[instanceId]
    let defKeys = keysByDefId[instance.defId]

    if (defKeys) {
      let def = defs[instance.defId]

      for (let key of defKeys) {
        sliceEventInstance(def, instance, framingRange, nextDayThreshold, states[key])
      }
    }
  }

  for (let key of keys) {
    let state = states[key]

    emitInverseComplements(state, framingRange, defs)
    res[key] = {
      fg: sliceEventRanges(state.fg, daySeries, dayCols, lane),
      bg: sliceEventRanges(state.bg, daySeries, dayCols, lane),
    }
  }

  return res
}

// a def's keys among the ones asked for, each once
function filterRequestedKeys(defKeys: string[], states: { [key: string]: EventSliceState }): string[] {
  let filtered: string[] = []

  for (let key of defKeys) {
    if (states[key] && filtered.indexOf(key) === -1) {
      filtered.push(key)
    }
  }

  return filtered
}

export function sliceDayTableBusinessHours(
  businessHours: EventStore | null,
  daySeries: DaySeries,
  dayCols: DayCol[],
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  context: CalendarContext,
): DayTableSeg[] {
  if (!businessHours) {
    return []
  }

  let framingRange = computeActiveRange(dateProfile, Boolean(nextDayThreshold))
  let rangeRes = sliceEventStore(
    expandRecurring(businessHours, framingRange, context),
    {},
    framingRange,
    nextDayThreshold,
  )

  return sliceEventRanges(rangeRes.bg, daySeries, dayCols, lane)
}

/*
Fabricates an event range for the selection (a new def and instance, with new ids), so this must
only rerun when its inputs change: the instance id keys the selection mirror
*/
export function sliceDayTableDateSelection(
  dateSelection: DateSpan | null,
  eventUiBases: EventUiHash,
  daySeries: DaySeries,
  dayCols: DayCol[],
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  context: CalendarContext,
): DayTableSeg[] {
  if (!dateSelection) {
    return []
  }

  let activeRange = computeActiveRange(dateProfile, Boolean(nextDayThreshold))
  let slicedDateSpan = intersectDateSpan(dateSelection, activeRange)

  if (slicedDateSpan) {
    let eventRange = fabricateEventRange(slicedDateSpan, eventUiBases, context)
    let segs = sliceRangeToCoords(slicedDateSpan.range, daySeries, dayCols, lane) as DayTableSeg[]

    for (let seg of segs) {
      seg.eventRange = eventRange
    }

    return segs
  }

  return []
}

export function intersectDateSpan(dateSpan: DateSpan, activeRange: DateRange): DateSpan | null {
  const activeDateSpanRange = intersectRanges(dateSpan.range, activeRange)

  if (activeDateSpanRange) {
    const slicedDateSpan = { ...dateSpan, range: activeDateSpanRange }

    if (activeDateSpanRange.start.valueOf() !== dateSpan.range.start.valueOf()) {
      delete slicedDateSpan.instantStartMs
    }
    if (activeDateSpanRange.end.valueOf() !== dateSpan.range.end.valueOf()) {
      delete slicedDateSpan.instantEndMs
    }

    return slicedDateSpan
  }

  return null
}

/*
A key's part of a drag or resize: segs from the mutated events whose MUTATED def has the key, and
the affected instances whose AFFECTED def has it (both within the lane). null when neither has a def
for the key. `isPassthrough`: no split at all (the lane takes the whole interaction)
*/
export function sliceDayTableInteraction(
  interaction: EventInteractionState | null,
  key: string,
  eventUiBases: EventUiHash,
  keysForEventDef: (def: EventDef) => string[],
  isPassthrough: boolean,
  daySeries: DaySeries,
  dayCols: DayCol[],
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
): SlicedEventInteraction<DayTableRange> | null {
  if (!interaction) {
    return null
  }

  let affectedEvents = interaction.affectedEvents
  let mutatedEvents = interaction.mutatedEvents

  if (!isPassthrough) {
    let isDefInKey = (def: EventDef) => isDefInLane(def, lane) && keysForEventDef(def).indexOf(key) !== -1
    let affectedSubset = filterEventStore(affectedEvents, isDefInKey)
    let mutatedSubset = filterEventStore(mutatedEvents, isDefInKey)

    if (!affectedSubset && !mutatedSubset) {
      return null
    }

    affectedEvents = affectedSubset || EMPTY_EVENT_STORE
    mutatedEvents = mutatedSubset || EMPTY_EVENT_STORE
  }

  let rangeRes = sliceEventStore(
    mutatedEvents,
    eventUiBases,
    computeActiveRange(dateProfile, Boolean(nextDayThreshold)),
    nextDayThreshold,
  )

  return {
    segs: sliceEventRanges(rangeRes.fg, daySeries, dayCols, lane),
    affectedInstances: affectedEvents.instances,
    isEvent: interaction.isEvent,
  }
}

// the defs passing the test and their instances. null if no def passes
function filterEventStore(eventStore: EventStore, testDef: (def: EventDef) => boolean): EventStore | null {
  let defs: EventDefHash = {}
  let instances: EventInstanceHash = {}
  let anyDefs = false

  for (let defId in eventStore.defs) {
    let def = eventStore.defs[defId]

    if (testDef(def)) {
      defs[defId] = def
      anyDefs = true
    }
  }

  if (!anyDefs) {
    return null
  }

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]

    if (defs[instance.defId]) {
      instances[instanceId] = instance
    }
  }

  return { defs, instances }
}

/*
The selected instance, if it belongs to the lane (whatever its keys)
*/
export function resolveDayTableLaneEventSelection(
  eventSelection: string,
  eventStore: EventStore,
  lane: DayTableLane,
): string {
  let instance = eventSelection && eventStore.instances[eventSelection]
  let def = instance && eventStore.defs[instance.defId]

  return def && isDefInLane(def, lane) ? eventSelection : ''
}

/*
The selected instance, if it belongs to the lane and to a participating key or none
*/
export function resolveDayTableEventSelection(
  eventSelection: string,
  eventStore: EventStore,
  keys: string[], // the participating keys, '' excluded
  keysForEventDef: (def: EventDef) => string[],
  lane: DayTableLane,
): string {
  let instance = eventSelection && eventStore.instances[eventSelection]

  if (instance) {
    let def = eventStore.defs[instance.defId]

    if (def && isDefInLane(def, lane)) {
      for (let key of keysForEventDef(def)) {
        if (!key || keys.indexOf(key) !== -1) {
          return eventSelection
        }
      }
    }
  }

  return ''
}

// date coordinates
// -------------------------------------------------------------------------------------------------

function sliceEventRanges(
  eventRanges: EventRenderRange[],
  daySeries: DaySeries,
  dayCols: DayCol[],
  lane: DayTableLane,
): DayTableSeg[] {
  let segs: DayTableSeg[] = []

  for (let eventRange of eventRanges) {
    let dateRange = eventRange.range

    // multi-day events force-displayed as list-items take up only one day
    if (lane.kind === 'dayGrid' && eventRange.ui.display === 'list-item') {
      dateRange = {
        start: dateRange.start,
        end: addDays(dateRange.start, 1),
      }
    }

    for (let seg of sliceRangeToCoords(dateRange, daySeries, dayCols, lane) as DayTableSeg[]) {
      seg.eventRange = eventRange
      seg.isStart = eventRange.isStart && seg.isStart
      seg.isEnd = eventRange.isEnd && seg.isEnd
      segs.push(seg)
    }
  }

  return segs
}

export function sliceRangeToCoords(
  range: DateRange,
  daySeries: DaySeries,
  dayCols: DayCol[],
  lane: DayTableLane,
): DayTableRange[] {
  if (lane.kind === 'dayGrid') {
    // rows and column-in-row coordinates: the divisor is the dates per row
    return buildDayGridRanges(daySeries.sliceRange(range), dayCols.length)
  }

  let segs: TimeGridRange[] = []

  for (let col = 0; col < dayCols.length; col += 1) {
    let segRange = intersectRanges(range, dayCols[col].range)

    if (segRange) {
      segs.push({
        startDate: segRange.start,
        endDate: segRange.end,
        isStart: segRange.start.valueOf() === range.start.valueOf(),
        isEnd: segRange.end.valueOf() === range.end.valueOf(),
        col,
      })
    }
  }

  return segs
}
