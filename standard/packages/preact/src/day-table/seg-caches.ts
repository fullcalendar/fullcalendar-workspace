import { EventDefHash } from '../events/event-def'
import { EventUi, EventUiHash } from '../events/event-ui'
import { SlicedEventInteraction } from '../interactions/event-interaction-state'
import { memoize } from '../util/memoize'
import { DayTableModel } from './model'
import { DayTableKeying, DayTableLane } from './keying'
import { buildDefKeys, buildEventUiForKey, buildLaneKeysWithDefs, splitIndividualUi } from './event-ui-bases'
import { KeyedCache, createKeyedCache } from './keyed-cache'
import {
  DayTableEventSegs,
  DayTableRange,
  DayTableSeg,
  resolveDayTableEventSelection,
} from './slice-ranges'
import { DayTableSegCategory, getDayTableSegTransform, projectDayTableInteraction, projectDayTableSegs } from './project-segs'

/*
The caches behind useDayTableSegs: the per-key stage-1 caches and the bases they're keyed on, and the
stage-2 projection memos, one set per hook instance
*/

export type InteractionEntry = SlicedEventInteraction<DayTableRange> | null

export type ProjectSegsMemo = (
  model: DayTableModel,
  keying: DayTableKeying,
  lane: DayTableLane,
  category: DayTableSegCategory,
  ...buckets: DayTableSeg[][]
) => DayTableSeg[]

export type ProjectInteractionMemo = (
  model: DayTableModel,
  keying: DayTableKeying,
  lane: DayTableLane,
  ...entries: InteractionEntry[]
) => SlicedEventInteraction<DayTableRange> | null

export interface DayTableSegCaches {
  buildDefKeys: typeof buildDefKeys
  buildLaneKeysWithDefs: typeof buildLaneKeysWithDefs
  splitIndividualUi: typeof splitIndividualUi
  basesBuilders: { [key: string]: typeof buildEventUiForKey } // one per key: a key's bases hold while its inputs do
  events: KeyedCache<any[], DayTableEventSegs>
  businessHours: KeyedCache<any[], DayTableSeg[]>
  dateSelection: KeyedCache<any[], DayTableSeg[]>
  eventDrag: KeyedCache<any[], InteractionEntry>
  eventResize: KeyedCache<any[], InteractionEntry>
  resolveEventSelection: typeof resolveDayTableEventSelection
  projectFg: ProjectSegsMemo
  projectBg: ProjectSegsMemo
  projectBusinessHours: ProjectSegsMemo
  projectDateSelection: ProjectSegsMemo
  projectEventDrag: ProjectInteractionMemo
  projectEventResize: ProjectInteractionMemo
}

export function createDayTableSegCaches(): DayTableSegCaches {
  return {
    buildDefKeys: memoize(buildDefKeys),
    buildLaneKeysWithDefs: memoize(buildLaneKeysWithDefs),
    splitIndividualUi: memoize(splitIndividualUi),
    basesBuilders: {},
    events: createKeyedCache(),
    businessHours: createKeyedCache(),
    dateSelection: createKeyedCache(),
    eventDrag: createKeyedCache(),
    eventResize: createKeyedCache(),
    resolveEventSelection: memoize(resolveDayTableEventSelection),
    projectFg: memoize(projectSegsByKeys),
    projectBg: memoize(projectSegsByKeys),
    projectBusinessHours: memoize(projectSegsByKeys),
    projectDateSelection: memoize(projectSegsByKeys),
    projectEventDrag: memoize(projectInteractionByKeys),
    projectEventResize: memoize(projectInteractionByKeys),
  }
}

export function getBasesByKey(
  caches: DayTableSegCaches,
  keys: string[],
  keying: DayTableKeying,
  lane: DayTableLane,
  defs: EventDefHash,
  defKeys: { [defId: string]: string[] } | null, // null: a passthrough lane
  eventUiBases: EventUiHash,
): { [key: string]: EventUiHash } {
  if (!defKeys) {
    return { '': eventUiBases }
  }

  const individualUi = caches.splitIndividualUi(eventUiBases, defKeys, defs, lane)
  const prevBuilders = caches.basesBuilders
  const builders: { [key: string]: typeof buildEventUiForKey } = {}
  const basesByKey: { [key: string]: EventUiHash } = {}

  for (let key of keys) {
    let builder = builders[key] = prevBuilders[key] || memoize(buildEventUiForKey)
    let keyUi: EventUi | undefined = keying.uiByKey[key]

    basesByKey[key] = builder(eventUiBases[''], keyUi, individualUi[key])
  }

  caches.basesBuilders = builders // keys no longer present are dropped

  return basesByKey
}

// the stage-1 results, given in key order (keying.keys then ''), as a hash
export function projectSegsByKeys(
  model: DayTableModel,
  keying: DayTableKeying,
  lane: DayTableLane,
  category: DayTableSegCategory,
  ...buckets: DayTableSeg[][]
): DayTableSeg[] {
  return projectDayTableSegs(
    zipKeys(keying, buckets),
    model,
    keying,
    category,
    getDayTableSegTransform(lane),
  )
}

export function projectInteractionByKeys(
  model: DayTableModel,
  keying: DayTableKeying,
  lane: DayTableLane,
  ...entries: InteractionEntry[]
): SlicedEventInteraction<DayTableRange> | null {
  return projectDayTableInteraction(zipKeys(keying, entries), model, keying, getDayTableSegTransform(lane))
}

export function zipKeys<T>(keying: DayTableKeying, values: T[]): { [key: string]: T } {
  let hash: { [key: string]: T } = {}

  keying.keys.forEach((key, i) => {
    hash[key] = values[i]
  })
  hash[''] = values[keying.keys.length]

  return hash
}

export function mapKeys<T>(keys: string[], func: (key: string) => T): { [key: string]: T } {
  let hash: { [key: string]: T } = {}

  for (let key of keys) {
    hash[key] = func(key)
  }

  return hash
}
