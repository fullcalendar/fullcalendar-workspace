import { EventDef } from '../events/event-def'
import { EventStore } from '../events/event-store'
import { DateSpan } from '../events/date-span'
import { EventUi } from '../events/event-ui'
import { hasBgRendering } from '../event-segs/event-rendering'

/*
Which entity keys (premium: resource ids) a def or span belongs to, each key's own UI and business
hours, and where keyless ('') things render. Plain views have no keys: everything is keyless.

The functions must be module-level (stable identity): the slicing caches don't compare the keying,
only the per-key values it carries, so a new keying (a resource renamed) re-slices nothing.
*/
export interface DayTableKeying {
  keys: string[] // the participating keys in order, '' excluded
  keysForEventDef(def: EventDef): string[]
  keyForDateSpan(span: DateSpan): string
  uiByKey: { [key: string]: EventUi | undefined }
  businessHoursByKey: { [key: string]: EventStore | undefined }
  keylessRules: KeylessRules
}

/*
Where the keyless ('') things go. "Keyed" columns belong to a key, "placeholder" columns to none
(in plain and resourceless models, every column)
*/
export interface KeylessRules {
  fg: 'all' | 'none' // keyed and placeholder columns, or nowhere
  // (bg events and date selections always go to every column, business hours to placeholders only:
  // every key has its own, falling back to the calendar's)
  interactionSegs: 'all' | 'keyedOnly'
  interactionMetadata: 'included' | 'excluded' // the keyless affectedInstances/isEvent
  interactionActivation: 'any' | 'keyedOnly' // whether a keyless interaction alone renders
  eventSelection: 'passthrough' | 'membership' // as given, or only if the instance is in a participating key
}

export const PLAIN_KEYLESS_RULES: KeylessRules = {
  fg: 'all',
  interactionSegs: 'all',
  interactionMetadata: 'included',
  interactionActivation: 'any',
  eventSelection: 'passthrough',
}

export const PLAIN_KEYING: DayTableKeying = {
  keys: [],
  keysForEventDef: getPlainKeysForEventDef,
  keyForDateSpan: getPlainKeyForDateSpan,
  uiByKey: {},
  businessHoursByKey: {},
  keylessRules: PLAIN_KEYLESS_RULES,
}

const PLAIN_KEYS = ['']

function getPlainKeysForEventDef(): string[] {
  return PLAIN_KEYS
}

function getPlainKeyForDateSpan(): string {
  return ''
}

// lanes
// -------------------------------------------------------------------------------------------------

export interface DayTableLane {
  // 'dayGrid': all-day coordinates (DayGridRange, column-in-row), list-item events are one day
  // 'timeGrid': timed coordinates (TimeGridRange, col = dateI)
  kind: 'dayGrid' | 'timeGrid'
  // TimeGrid only, which of its two lanes. undefined: everything (DayGrid)
  allDayFilter?: 'allDay' | 'timed'
}

export const DAY_GRID_LANE: DayTableLane = { kind: 'dayGrid' }
export const TIME_GRID_ALL_DAY_LANE: DayTableLane = { kind: 'dayGrid', allDayFilter: 'allDay' }
export const TIME_GRID_TIMED_LANE: DayTableLane = { kind: 'timeGrid', allDayFilter: 'timed' }

/*
Timed defs go to the timed lane. All-day defs go to the all-day lane, and to the timed lane too
when the def itself (not its source or the calendar) renders as a background
*/
export function isDefInLane(def: EventDef, lane: DayTableLane): boolean {
  switch (lane.allDayFilter) {
    case 'allDay':
      return def.allDay
    case 'timed':
      return !def.allDay || hasBgRendering(def)
    default:
      return true
  }
}

export function isSpanInLane(span: DateSpan, lane: DayTableLane): boolean {
  switch (lane.allDayFilter) {
    case 'allDay':
      return span.allDay
    case 'timed':
      return !span.allDay
    default:
      return true
  }
}

/*
Whether the lane takes the view's props as they are: one key, every def, the view's own event UI
bases (DayGrid never split its props)
*/
export function isPassthroughLane(keying: DayTableKeying, lane: DayTableLane): boolean {
  return keying === PLAIN_KEYING && !lane.allDayFilter
}
