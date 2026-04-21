import { Duration, startOfDay } from '@full-ui/headless-calendar'
import { EventStore, createEmptyEventStore } from './event-store'
import { EventDef } from './event-def'
import { EventInstance } from './event-instance'
import { computeAlignedDayRange } from '../util/date'
import { EventUiHash, EventUi } from '../component-util/event-ui'
import { compileEventUis } from '../component-util/event-rendering'
import { CalendarContext } from '../CalendarContext'
import { getDefaultEventEnd } from '../calendar-utils'

/*
A data structure for how to modify an EventDef/EventInstance within an EventStore
*/

export interface EventMutation {
  datesDelta?: Duration // body start+end moving together. for dragging
  startDelta?: Duration // for resizing
  endDelta?: Duration // for resizing
  // Timeline timed hits can carry canonical instant deltas so DST gaps/folds do not get
  // reinterpreted through generic civil-marker arithmetic when applying mutations.
  instantDatesDeltaMs?: number
  instantStartDeltaMs?: number
  instantEndDeltaMs?: number
  standardProps?: any // for the def. should not include extendedProps
  extendedProps?: any // for the def
}

// applies the mutation to ALL defs/instances within the event store
export function applyMutationToEventStore(
  eventStore: EventStore,
  eventConfigBase: EventUiHash,
  mutation: EventMutation,
  context: CalendarContext,
): EventStore {
  let eventConfigs = compileEventUis(eventStore.defs, eventConfigBase)
  let dest = createEmptyEventStore()

  for (let defId in eventStore.defs) {
    let def = eventStore.defs[defId]

    dest.defs[defId] = applyMutationToEventDef(def, eventConfigs[defId], mutation, context)
  }

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]
    let def = dest.defs[instance.defId] // important to grab the newly modified def

    dest.instances[instanceId] = applyMutationToEventInstance(instance, def, eventConfigs[instance.defId], mutation, context)
  }

  return dest
}

export type eventDefMutationApplier = (eventDef: EventDef, mutation: EventMutation, context: CalendarContext) => void

function applyMutationToEventDef(eventDef: EventDef, eventConfig: EventUi, mutation: EventMutation, context: CalendarContext): EventDef {
  let standardProps = mutation.standardProps || {}

  // if hasEnd has not been specified, guess a good value based on deltas.
  // if duration will change, there's no way the default duration will persist,
  // and thus, we need to mark the event as having a real end
  if (
    standardProps.hasEnd == null &&
    eventConfig.durationEditable &&
    (mutation.startDelta || mutation.endDelta)
  ) {
    standardProps.hasEnd = true // TODO: is this mutation okay?
  }

  let copy: EventDef = {
    ...eventDef,
    ...standardProps,
    ui: { ...eventDef.ui, ...standardProps.ui }, // the only prop we want to recursively overlay
  }

  if (mutation.extendedProps) {
    copy.extendedProps = { ...copy.extendedProps, ...mutation.extendedProps }
  }

  for (let applier of context.pluginHooks.eventDefMutationAppliers) {
    applier(copy, mutation, context)
  }

  if (!copy.hasEnd && context.options.forceEventDuration) {
    copy.hasEnd = true
  }

  return copy
}

function applyMutationToEventInstance(
  eventInstance: EventInstance,
  eventDef: EventDef, // must first be modified by applyMutationToEventDef
  eventConfig: EventUi,
  mutation: EventMutation,
  context: CalendarContext,
): EventInstance {
  let forceAllDay = mutation.standardProps && mutation.standardProps.allDay === true
  let clearEnd = mutation.standardProps && mutation.standardProps.hasEnd === false
  let copy = { ...eventInstance } as EventInstance

  if (forceAllDay) {
    copy.range = computeAlignedDayRange(copy.range)
  }

  if (mutation.datesDelta && eventConfig.startEditable) {
    copy.range = mutation.instantDatesDeltaMs != null
      ? buildTimelineMutatedRange(copy.range, mutation.instantDatesDeltaMs, mutation.instantDatesDeltaMs, context)
      : {
        start: addMutationToMarker(copy.range.start, mutation.datesDelta, undefined, context),
        end: addMutationToMarker(copy.range.end, mutation.datesDelta, undefined, context),
      }
  }

  if (mutation.startDelta && eventConfig.durationEditable) {
    copy.range = mutation.instantStartDeltaMs != null
      ? buildTimelineMutatedRange(copy.range, mutation.instantStartDeltaMs, 0, context)
      : {
        start: addMutationToMarker(copy.range.start, mutation.startDelta, undefined, context),
        end: copy.range.end,
      }
  }

  if (mutation.endDelta && eventConfig.durationEditable) {
    copy.range = mutation.instantEndDeltaMs != null
      ? buildTimelineMutatedRange(copy.range, 0, mutation.instantEndDeltaMs, context)
      : {
        start: copy.range.start,
        end: addMutationToMarker(copy.range.end, mutation.endDelta, undefined, context),
      }
  }

  if (clearEnd) {
    copy.range = {
      start: copy.range.start,
      end: getDefaultEventEnd(eventDef.allDay, copy.range.start, context),
    }
  }

  // in case event was all-day but the supplied deltas were not
  // better util for this?
  if (eventDef.allDay) {
    copy.range = {
      start: startOfDay(copy.range.start),
      end: startOfDay(copy.range.end),
    }
  }

  // handle invalid durations
  if (copy.range.end < copy.range.start) {
    copy.range.end = getDefaultEventEnd(eventDef.allDay, copy.range.start, context)
  }

  return copy
}

export function addMutationToMarker(
  marker: Date,
  delta: Duration,
  instantDeltaMs: number | undefined,
  context: CalendarContext,
): Date {
  if (instantDeltaMs != null) {
    return context.dateEnv.timestampToMarker(
      context.dateEnv.toDate(marker).valueOf() + instantDeltaMs,
    )
  }

  return context.dateEnv.add(marker, delta)
}

function buildTimelineMutatedRange(
  range: EventInstance['range'],
  startDeltaMs: number,
  endDeltaMs: number,
  context: CalendarContext,
): EventInstance['range'] {
  const startMs = getRangeBoundaryMs(range, 'start', context) + startDeltaMs
  const endMs = getRangeBoundaryMs(range, 'end', context) + endDeltaMs

  return {
    start: context.dateEnv.timestampToMarker(startMs),
    end: context.dateEnv.timestampToMarker(endMs),
    timelineStartMs: startMs,
    timelineEndMs: endMs,
  }
}

function getRangeBoundaryMs(
  range: EventInstance['range'],
  edge: 'start' | 'end',
  context: CalendarContext,
): number {
  const propName = edge === 'start' ? 'timelineStartMs' : 'timelineEndMs'
  return range[propName] ?? context.dateEnv.toDate(range[edge]).valueOf()
}
