import { DateMarker, Duration } from '@full-ui/headless-calendar'
import { useMemo, useState } from 'react'
import { DateProfile } from '../../DateProfileGenerator'
import { CalendarContext } from '../../CalendarContext'
import { EventDefHash } from '../../structs/event-def'
import { EventUi, EventUiHash } from '../../component-util/event-ui'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { EventInteractionState } from '../../interactions/event-interaction-state'
import { TimeGridRange, organizeSegsByCol } from '../../timegrid/TimeColsSeg'
import { memoize } from '../../util/memoize'
import { SliceableProps, SlicedProps } from '../slicing-utils'
import { DayTableModel } from './model'
import { DayTableKeying, DayTableLane, isPassthroughLane, isSpanInLane } from './keying'
import { buildDefKeys, buildEventUiForKey, buildLaneKeysWithDefs, splitIndividualUi } from './event-ui-bases'
import { KeyedCache, createKeyedCache } from './keyed-cache'
import {
  DayTableEventSegs,
  DayTableRange,
  DayTableSeg,
  resolveDayTableEventSelection,
  sliceDayTableBusinessHours,
  sliceDayTableDateSelection,
  sliceDayTableEvents,
  sliceDayTableInteraction,
} from './slice-ranges'
import { DayTableSegCategory, getDayTableSegTransform, projectDayTableInteraction, projectDayTableSegs } from './project'
import { sliceDayTableNowIndicator } from './now-indicator'

type InteractionEntry = EventSegUiInteractionState<DayTableRange> | null

/*
A day-table lane's segs (DayGrid's table, or one of TimeGrid's two lanes), in the model's view
columns. Stage 1 slices per key in date coordinates through per-key caches whose args are per-key
values only (never the keying, the model or an entity), so a model or keying change (a resource
renamed) re-slices nothing and keeps every fabricated selection instance. Stage 2 projects onto the
model's columns, memoized on the model, the keying and the stage-1 results.
*/
export function useDayTableSegs<R extends DayTableRange>(
  props: SliceableProps,
  keying: DayTableKeying,
  model: DayTableModel,
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  context: CalendarContext,
): SlicedProps<R> {
  const [caches] = useState(createDayTableSegCaches)
  const { daySeries, dayCols } = model
  const { eventStore, eventUiBases } = props
  const keys = keying.keys.concat([''])
  const isPassthrough = isPassthroughLane(keying, lane)
  const defKeys = isPassthrough ? null : caches.buildDefKeys(eventStore.defs, keying.keysForEventDef)
  const basesByKey = getBasesByKey(caches, keys, keying, lane, eventStore.defs, defKeys, eventUiBases)
  // a key without defs in the lane holds onto its (empty) segs while the store changes elsewhere,
  // as the Splitter's constant empty store did
  const keysWithDefs = defKeys && caches.buildLaneKeysWithDefs(eventStore.defs, defKeys, lane)
  const eventStoreFor = (key: string) => (!keysWithDefs || keysWithDefs[key] ? eventStore : null)

  const eventSegs = caches.events.get(
    keys,
    (key) => [eventStoreFor(key), basesByKey[key], daySeries, dayCols, lane, dateProfile, nextDayThreshold],
    (staleKeys) => sliceDayTableEvents(
      eventStore,
      staleKeys,
      basesByKey,
      keying.keysForEventDef,
      daySeries,
      dayCols,
      lane,
      dateProfile,
      nextDayThreshold,
    ),
  )

  const businessHourSegs = caches.businessHours.get(
    keys,
    (key) => [
      keying.businessHoursByKey[key] || props.businessHours,
      daySeries, dayCols, lane, dateProfile, nextDayThreshold, context,
    ],
    (staleKeys) => mapKeys(staleKeys, (key) => sliceDayTableBusinessHours(
      keying.businessHoursByKey[key] || props.businessHours,
      daySeries, dayCols, lane, dateProfile, nextDayThreshold, context,
    )),
  )

  const { dateSelection } = props
  const dateSelectionKey = dateSelection && isSpanInLane(dateSelection, lane)
    ? keying.keyForDateSpan(dateSelection)
    : null
  const dateSelectionFor = (key: string) => (key === dateSelectionKey ? dateSelection : null)
  const dateSelectionSegs = caches.dateSelection.get(
    keys,
    (key) => [dateSelectionFor(key), basesByKey[key], daySeries, dayCols, lane, dateProfile, nextDayThreshold, context],
    (staleKeys) => mapKeys(staleKeys, (key) => sliceDayTableDateSelection(
      dateSelectionFor(key), basesByKey[key], daySeries, dayCols, lane, dateProfile, nextDayThreshold, context,
    )),
  )

  const sliceInteraction = (cache: KeyedCache<any[], InteractionEntry>, interaction: EventInteractionState | null) => (
    cache.get(
      keys,
      (key) => [interaction, basesByKey[key], daySeries, dayCols, lane, dateProfile, nextDayThreshold],
      (staleKeys) => mapKeys(staleKeys, (key) => sliceDayTableInteraction(
        interaction, key, basesByKey[key], keying.keysForEventDef, isPassthrough,
        daySeries, dayCols, lane, dateProfile, nextDayThreshold,
      )),
    )
  )
  const eventDrags = sliceInteraction(caches.eventDrag, props.eventDrag)
  const eventResizes = sliceInteraction(caches.eventResize, props.eventResize)

  const eventSelection = keying.keylessRules.eventSelection === 'passthrough'
    ? props.eventSelection
    : caches.resolveEventSelection(props.eventSelection, eventStore, keying.keys, keying.keysForEventDef, lane)

  const project = (memo: ProjectSegsMemo, category: DayTableSegCategory, buckets: DayTableSeg[][]) => (
    memo(model, keying, lane, category, ...buckets)
  )

  return {
    fgEventSegs: project(caches.projectFg, 'fg', keys.map((key) => eventSegs[key].fg)) as any,
    bgEventSegs: project(caches.projectBg, 'bg', keys.map((key) => eventSegs[key].bg)) as any,
    businessHourSegs: project(caches.projectBusinessHours, 'businessHours', keys.map((key) => businessHourSegs[key])) as any,
    dateSelectionSegs: project(caches.projectDateSelection, 'dateSelection', keys.map((key) => dateSelectionSegs[key])) as any,
    eventDrag: caches.projectEventDrag(model, keying, lane, ...keys.map((key) => eventDrags[key])) as any,
    eventResize: caches.projectEventResize(model, keying, lane, ...keys.map((key) => eventResizes[key])) as any,
    eventSelection,
  }
}

/*
The now indicator's segs by view column. Memoized: a now tick that doesn't move them, or any other
re-render, gives the columns the same arrays
*/
export function useNowIndicatorSegsByCol(
  nowDate: DateMarker,
  model: DayTableModel,
  keying: DayTableKeying,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  datesAboveResources: boolean,
  isEnabled: boolean,
): TimeGridRange[][] {
  return useMemo(
    () => organizeSegsByCol(
      isEnabled
        ? sliceDayTableNowIndicator(nowDate, model, keying, dateProfile, nextDayThreshold, datesAboveResources)
        : null,
      model.colCount,
    ),
    [isEnabled, nowDate, model, keying, dateProfile, nextDayThreshold, datesAboveResources],
  )
}

// caches
// -------------------------------------------------------------------------------------------------

type ProjectSegsMemo = (
  model: DayTableModel,
  keying: DayTableKeying,
  lane: DayTableLane,
  category: DayTableSegCategory,
  ...buckets: DayTableSeg[][]
) => DayTableSeg[]

type ProjectInteractionMemo = (
  model: DayTableModel,
  keying: DayTableKeying,
  lane: DayTableLane,
  ...entries: InteractionEntry[]
) => EventSegUiInteractionState<DayTableRange> | null

interface DayTableSegCaches {
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

function createDayTableSegCaches(): DayTableSegCaches {
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

function getBasesByKey(
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
function projectSegsByKeys(
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

function projectInteractionByKeys(
  model: DayTableModel,
  keying: DayTableKeying,
  lane: DayTableLane,
  ...entries: InteractionEntry[]
): EventSegUiInteractionState<DayTableRange> | null {
  return projectDayTableInteraction(zipKeys(keying, entries), model, keying, getDayTableSegTransform(lane))
}

function zipKeys<T>(keying: DayTableKeying, values: T[]): { [key: string]: T } {
  let hash: { [key: string]: T } = {}

  keying.keys.forEach((key, i) => {
    hash[key] = values[i]
  })
  hash[''] = values[keying.keys.length]

  return hash
}

function mapKeys<T>(keys: string[], func: (key: string) => T): { [key: string]: T } {
  let hash: { [key: string]: T } = {}

  for (let key of keys) {
    hash[key] = func(key)
  }

  return hash
}
