import { EventSegUiInteractionState } from '../interactions/event-interaction-state'
import { DayGridRange } from './day-grid-range'
import { TimeGridRange } from './time-grid-range'
import { DayTableModel, computeDayTableColRanges, lookUpDayTableCol } from './model'
import { DayTableKeying, DayTableLane, PLAIN_KEYING } from './keying'
import { DayTableSeg } from './slice-ranges'

/*
Stage 2 of the day-table pipeline: puts stage 1's per-key segs (date coordinates) onto the model's
view columns. A key's segs go to its own columns; the keyless ('') segs go to every keyed column
and/or the placeholder columns, by category, per the keying's rules. The order: for each key, its
own segs then the keyless ones in its columns; then the keyless ones in the placeholders.

New seg objects spread the stage-1 seg, so its eventRange (identity) carries over. Plain keying
returns the stage-1 arrays themselves.
*/

export type DayTableSegCategory = 'fg' | 'bg' | 'businessHours' | 'dateSelection'

type SegTransform = (seg: DayTableSeg, model: DayTableModel, entityKey: string) => DayTableSeg[]

export function getDayTableSegTransform(lane: DayTableLane): SegTransform {
  return lane.kind === 'dayGrid' ? transformDayGridSeg : transformTimeGridSeg
}

export function projectDayTableSegs(
  buckets: { [key: string]: DayTableSeg[] },
  model: DayTableModel,
  keying: DayTableKeying,
  category: DayTableSegCategory,
  transform: SegTransform,
): DayTableSeg[] {
  if (keying === PLAIN_KEYING) {
    return buckets['']
  }

  let keylessSegs = buckets['']
  let keylessIntoKeyed: boolean
  let keylessIntoPlaceholders: boolean

  switch (category) {
    case 'fg':
      keylessIntoKeyed = keylessIntoPlaceholders = keying.keylessRules.fg === 'all'
      break
    case 'businessHours': // every key has its own, falling back to the calendar's
      keylessIntoKeyed = false
      keylessIntoPlaceholders = true
      break
    default:
      keylessIntoKeyed = keylessIntoPlaceholders = true
  }

  let segs: DayTableSeg[] = []

  for (let key of keying.keys) {
    for (let seg of buckets[key]) {
      segs.push(...transform(seg, model, key))
    }

    if (keylessIntoKeyed) {
      for (let seg of keylessSegs) {
        segs.push(...transform(seg, model, key))
      }
    }
  }

  if (keylessIntoPlaceholders) {
    for (let seg of keylessSegs) {
      segs.push(...transform(seg, model, ''))
    }
  }

  return segs
}

export function projectDayTableInteraction(
  entries: { [key: string]: EventSegUiInteractionState<any> | null },
  model: DayTableModel,
  keying: DayTableKeying,
  transform: SegTransform,
): EventSegUiInteractionState<any> | null {
  if (keying === PLAIN_KEYING) {
    return entries['']
  }

  let rules = keying.keylessRules
  let keyless = entries['']
  let affectedInstances = {}
  let segs: DayTableSeg[] = []
  let isActive = false
  let isEvent = false

  for (let key of keying.keys) {
    let entry = entries[key]

    if (entry) {
      isActive = true
      isEvent = isEvent || entry.isEvent
      Object.assign(affectedInstances, entry.affectedInstances)

      for (let seg of entry.segs) {
        segs.push(...transform(seg, model, key))
      }
    }

    if (keyless) {
      for (let seg of keyless.segs) {
        segs.push(...transform(seg, model, key))
      }
    }
  }

  if (keyless) {
    if (rules.interactionSegs === 'all') {
      for (let seg of keyless.segs) {
        segs.push(...transform(seg, model, ''))
      }
    }

    if (rules.interactionMetadata === 'included') {
      isEvent = isEvent || keyless.isEvent
      Object.assign(affectedInstances, keyless.affectedInstances)
    }

    if (rules.interactionActivation === 'any') {
      isActive = true
    }
  }

  // a keyless interaction alone doesn't render under keyedOnly activation, though it has segs
  return isActive ? { affectedInstances, segs, isEvent } : null
}

// a [start, end) of date columns in a row, over the entity's view columns of that row
function transformDayGridSeg(seg: DayTableSeg, model: DayTableModel, entityKey: string): DayTableSeg[] {
  let dayGridSeg = seg as DayGridRange & DayTableSeg

  return computeDayTableColRanges(model, dayGridSeg.start, dayGridSeg.end, entityKey).map((colRange) => ({
    ...dayGridSeg,
    ...colRange,
    isStart: dayGridSeg.isStart && colRange.isStart,
    isEnd: dayGridSeg.isEnd && colRange.isEnd,
  }))
}

// a date column's seg into the entity's view column of that date, if there is one
function transformTimeGridSeg(seg: DayTableSeg, model: DayTableModel, entityKey: string): DayTableSeg[] {
  let timeGridSeg = seg as TimeGridRange & DayTableSeg
  let col = lookUpDayTableCol(model, timeGridSeg.col, entityKey)

  if (col === -1) {
    return []
  }

  return [{ ...timeGridSeg, col }]
}
