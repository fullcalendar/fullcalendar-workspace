import { DateMarker, Duration } from '@full-ui/headless-calendar'
import { useMemo, useState } from 'react'
import { DateProfile } from '../date-profile/DateProfileGenerator'
import { CalendarContext } from '../context/CalendarContext'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { TimeGridRange, organizeSegsByCol } from './time-grid-range'
import { SliceableProps, SlicedProps } from '../event-segs/Slicer'
import { DayTableModel } from './model'
import { DayTableKeying, DayTableLane, isPassthroughLane, isSpanInLane } from './keying'
import { KeyedCache } from './keyed-cache'
import {
  DayTableRange,
  DayTableSeg,
  sliceDayTableBusinessHours,
  sliceDayTableDateSelection,
  sliceDayTableEvents,
  sliceDayTableInteraction,
} from './slice-ranges'
import { DayTableSegCategory } from './project-segs'
import { sliceDayTableNowIndicator } from './now-indicator'

import {
  InteractionEntry, ProjectSegsMemo, createDayTableSegCaches, getBasesByKey, mapKeys,
} from './seg-caches'
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

  // stage 1: per key, in date coordinates
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

  // stage 2: onto the model's view columns
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
