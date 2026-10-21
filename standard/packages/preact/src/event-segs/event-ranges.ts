import { EventDef, EventDefHash } from '../events/event-def'
import { buildEventInstanceRange, EventInstance, EventInstanceRange } from '../events/event-instance'
import { EventTuple } from '../events/event-parse'
import { EventStore } from '../events/event-store'
import {
  DateRange,
  invertRanges,
  intersectRanges,
  Duration,
} from '@full-ui/headless-calendar'
import { compareByFieldSpecs, OrderSpec } from '../util/misc'
import { computeVisibleDayRange } from '../util/date'
import { EventImpl } from '../api/EventImpl'
import { EventUi, EventUiHash, combineEventUis } from '../events/event-ui'
import { mapHash } from '../util/object'

/*
Events as render ranges: an event store sliced to a framing range (the three stages, with inverse
backgrounds), the event UIs compiled per def, and segs sorted by the event order
*/

export interface EventRenderRange extends EventTuple {
  ui: EventUi

  // a transformed version of eventInstance.range
  // if view renders whole-days, `range` is all-day
  // otherwise, `range` is timed (and may carry exact instants for unclipped edges)
  range: EventInstanceRange
  isStart: boolean
  isEnd: boolean
}

export interface EventRangeProps {
  eventRange: EventRenderRange
}

/*
Specifying nextDayThreshold signals that all-day ranges should be sliced.
*/
export function sliceEventStore(eventStore: EventStore, eventUiBases: EventUiHash, framingRange: DateRange, nextDayThreshold?: Duration) {
  let { defs, instances } = eventStore
  let state = createEventSliceState()

  for (let defId in defs) {
    initEventSliceDef(defs[defId], compileEventUi(defs[defId], eventUiBases), state)
  }

  for (let instanceId in instances) {
    let instance = instances[instanceId]

    sliceEventInstance(defs[instance.defId], instance, framingRange, nextDayThreshold, state)
  }

  emitInverseComplements(state, framingRange, defs)

  return { bg: state.bg, fg: state.fg }
}

/*
sliceEventStore's three stages, over an explicit state, so one pass over a store can fill several
states (the day-table pipeline keeps one per key): every def first (its UI, and the
inverse-background groups), then the instances in store order, then the inverse complements, by
group then by def. Ranges come out in instance order, complements last
*/
export interface EventSliceState {
  uiByDefId: { [defId: string]: EventUi }
  inverseBgByGroupId: { [groupId: string]: DateRange[] }
  inverseBgByDefId: { [defId: string]: DateRange[] }
  defByGroupId: { [groupId: string]: EventDef }
  bg: EventRenderRange[]
  fg: EventRenderRange[]
}

export function createEventSliceState(): EventSliceState {
  return {
    uiByDefId: {},
    inverseBgByGroupId: {},
    inverseBgByDefId: {},
    defByGroupId: {},
    bg: [],
    fg: [],
  }
}

export function initEventSliceDef(def: EventDef, ui: EventUi, state: EventSliceState): void {
  state.uiByDefId[def.defId] = ui

  if (ui.display === 'inverse-background') {
    if (def.groupId) {
      state.inverseBgByGroupId[def.groupId] = []

      if (!state.defByGroupId[def.groupId]) {
        state.defByGroupId[def.groupId] = def
      }
    } else {
      state.inverseBgByDefId[def.defId] = []
    }
  }
}

export function sliceEventInstance(
  def: EventDef,
  instance: EventInstance,
  framingRange: DateRange,
  nextDayThreshold: Duration | null | undefined,
  state: EventSliceState,
): void {
  let ui = state.uiByDefId[def.defId]
  let origRange = instance.range

  let normalRange = (!def.allDay && nextDayThreshold) ?
    computeVisibleDayRange(origRange, nextDayThreshold) :
    origRange

  let slicedRange = intersectRanges(normalRange, framingRange)

  if (slicedRange) {
    if (ui.display === 'inverse-background') {
      if (def.groupId) {
        state.inverseBgByGroupId[def.groupId].push(slicedRange)
      } else {
        state.inverseBgByDefId[instance.defId].push(slicedRange)
      }
    } else if (ui.display !== 'none') {
      (ui.display === 'background' ? state.bg : state.fg).push({
        def,
        ui,
        instance,
        range: buildSlicedEventRange(origRange, normalRange, slicedRange),
        isStart: normalRange.start && normalRange.start.valueOf() === slicedRange.start.valueOf(),
        isEnd: normalRange.end && normalRange.end.valueOf() === slicedRange.end.valueOf(),
      })
    }
  }
}

export function emitInverseComplements(state: EventSliceState, framingRange: DateRange, defs: EventDefHash): void {
  for (let groupId in state.inverseBgByGroupId) { // BY GROUP
    let ranges = state.inverseBgByGroupId[groupId]
    let invertedRanges = invertRanges(ranges, framingRange)

    for (let invertedRange of invertedRanges) {
      let def = state.defByGroupId[groupId]
      let ui = state.uiByDefId[def.defId]

      state.bg.push({
        def,
        ui,
        instance: null,
        range: invertedRange,
        isStart: false,
        isEnd: false,
      })
    }
  }

  for (let defId in state.inverseBgByDefId) {
    let ranges = state.inverseBgByDefId[defId]
    let invertedRanges = invertRanges(ranges, framingRange)

    for (let invertedRange of invertedRanges) {
      state.bg.push({
        def: defs[defId],
        ui: state.uiByDefId[defId],
        instance: null,
        range: invertedRange,
        isStart: false,
        isEnd: false,
      })
    }
  }
}

/*
Carries instant fields from the original event range onto the sliced range, per-edge, only
for edges that were not clipped by the framing range. Only applies when the range was not
day-normalized (normalRange === origRange, i.e. timed events not subject to nextDayThreshold).
*/
function buildSlicedEventRange(
  origRange: EventInstanceRange,
  normalRange: DateRange,
  slicedRange: DateRange,
): EventInstanceRange {
  if (normalRange !== origRange) {
    return slicedRange
  }

  return buildEventInstanceRange(
    slicedRange.start,
    slicedRange.end,
    slicedRange.start.valueOf() === origRange.start.valueOf() ? origRange.instantStartMs : undefined,
    slicedRange.end.valueOf() === origRange.end.valueOf() ? origRange.instantEndMs : undefined,
  )
}

export function hasBgRendering(def: EventDef) {
  return def.ui.display === 'background' || def.ui.display === 'inverse-background'
}

// event ui computation

export function compileEventUis(eventDefs: EventDefHash, eventUiBases: EventUiHash) {
  return mapHash(eventDefs, (eventDef: EventDef) => compileEventUi(eventDef, eventUiBases))
}

/*
I wish we didn't need to deal with inheritance of all properties all together
I wish you could resolve just eventDisplay first, then the others
*/
export function compileEventUi(eventDef: EventDef, eventUiBases: EventUiHash) {
  const uis: EventUi[] = []
  const fallbackBase = eventUiBases['']
  const defBase = eventUiBases[eventDef.defId]

  if (fallbackBase) {
    uis.push(fallbackBase)
  }

  if (defBase) {
    uis.push(defBase)
  }

  uis.push(eventDef.ui)

  return combineEventUis(uis)
}

export function sortEventSegs<S extends EventRangeProps>(segs: S[], eventOrderSpecs: OrderSpec<EventImpl>[]): S[] {
  let objs = segs.map(buildSegCompareObj)

  objs.sort((obj0, obj1) => compareByFieldSpecs(obj0, obj1, eventOrderSpecs as any)) // !!!

  return objs.map((c) => c._seg)
}

// returns a object with all primitive props that can be compared
export function buildSegCompareObj<S extends EventRangeProps>(seg: S) {
  let { eventRange } = seg
  let eventDef = eventRange.def
  let range = eventRange.instance ? eventRange.instance.range : eventRange.range
  let start = range.start ? range.start.valueOf() : 0 // TODO: better support for open-range events
  let end = range.end ? range.end.valueOf() : 0 // "

  return {
    ...eventDef.extendedProps,
    ...eventDef,
    id: eventDef.publicId,
    start,
    end,
    duration: end - start,
    allDay: Number(eventDef.allDay),
    _seg: seg, // for later retrieval
  }
}

export function buildEventRangeKey(eventRange: EventRenderRange) {
  return eventRange.instance
    ? eventRange.instance.instanceId
    : `${eventRange.def.defId}:${eventRange.range.start.toISOString()}`
  // inverse-background events don't have specific instances. TODO: better solution
}
