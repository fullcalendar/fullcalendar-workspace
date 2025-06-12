import { EventDef, EventDefHash } from '../structs/event-def.js'
import { EventTuple } from '../structs/event-parse.js'
import { EventStore } from '../structs/event-store.js'
import { DateRange, invertRanges, intersectRanges, rangeContainsMarker } from '../datelib/date-range.js'
import { Duration } from '../datelib/duration.js'
import { compareByFieldSpecs, OrderSpec } from '../util/misc.js'
import { computeVisibleDayRange } from '../util/date.js'
import { EventImpl } from '../api/EventImpl.js'
import { EventUi, EventUiHash, combineEventUis } from './event-ui.js'
import { mapHash } from '../util/object.js'
import { ViewContext } from '../ViewContext.js'
import { DateFormatter } from '../datelib/DateFormatter.js'
import { addMs, DateMarker, startOfDay } from '../datelib/marker.js'
import { ViewApi } from '../api/ViewApi.js'
import { MountData } from '../common/render-hook.js'
import { createAriaKeyboardAttrs } from '../util/dom-event.js'

export interface EventRenderRange extends EventTuple {
  ui: EventUi

  // a transformed version of eventInstance.range
  // if view renders whole-days, `range` is all-day
  // otherwise, `range` is timed
  range: DateRange
  isStart: boolean
  isEnd: boolean
}

export interface EventRangeProps {
  eventRange: EventRenderRange
}

export function getEventKey(seg: EventRangeProps): string {
  return seg.eventRange.instance.instanceId
}

/*
Specifying nextDayThreshold signals that all-day ranges should be sliced.
*/
export function sliceEventStore(eventStore: EventStore, eventUiBases: EventUiHash, framingRange: DateRange, nextDayThreshold?: Duration) {
  let inverseBgByGroupId: { [groupId: string]: DateRange[] } = {}
  let inverseBgByDefId: { [defId: string]: DateRange[] } = {}
  let defByGroupId: { [groupId: string]: EventDef } = {}
  let bgRanges: EventRenderRange[] = []
  let fgRanges: EventRenderRange[] = []
  let eventUis = compileEventUis(eventStore.defs, eventUiBases)

  for (let defId in eventStore.defs) {
    let def = eventStore.defs[defId]
    let ui = eventUis[def.defId]

    if (ui.display === 'inverse-background') {
      if (def.groupId) {
        inverseBgByGroupId[def.groupId] = []

        if (!defByGroupId[def.groupId]) {
          defByGroupId[def.groupId] = def
        }
      } else {
        inverseBgByDefId[defId] = []
      }
    }
  }

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]
    let def = eventStore.defs[instance.defId]
    let ui = eventUis[def.defId]
    let origRange = instance.range

    let normalRange = (!def.allDay && nextDayThreshold) ?
      computeVisibleDayRange(origRange, nextDayThreshold) :
      origRange

    let slicedRange = intersectRanges(normalRange, framingRange)

    if (slicedRange) {
      if (ui.display === 'inverse-background') {
        if (def.groupId) {
          inverseBgByGroupId[def.groupId].push(slicedRange)
        } else {
          inverseBgByDefId[instance.defId].push(slicedRange)
        }
      } else if (ui.display !== 'none') {
        (ui.display === 'background' ? bgRanges : fgRanges).push({
          def,
          ui,
          instance,
          range: slicedRange,
          isStart: normalRange.start && normalRange.start.valueOf() === slicedRange.start.valueOf(),
          isEnd: normalRange.end && normalRange.end.valueOf() === slicedRange.end.valueOf(),
        })
      }
    }
  }

  for (let groupId in inverseBgByGroupId) { // BY GROUP
    let ranges = inverseBgByGroupId[groupId]
    let invertedRanges = invertRanges(ranges, framingRange)

    for (let invertedRange of invertedRanges) {
      let def = defByGroupId[groupId]
      let ui = eventUis[def.defId]

      bgRanges.push({
        def,
        ui,
        instance: null,
        range: invertedRange,
        isStart: false,
        isEnd: false,
      })
    }
  }

  for (let defId in inverseBgByDefId) {
    let ranges = inverseBgByDefId[defId]
    let invertedRanges = invertRanges(ranges, framingRange)

    for (let invertedRange of invertedRanges) {
      bgRanges.push({
        def: eventStore.defs[defId],
        ui: eventUis[defId],
        instance: null,
        range: invertedRange,
        isStart: false,
        isEnd: false,
      })
    }
  }

  return { bg: bgRanges, fg: fgRanges }
}

export function hasBgRendering(def: EventDef) {
  return def.ui.display === 'background' || def.ui.display === 'inverse-background'
}

export function setElEventRange(el: HTMLElement, eventRange: EventRenderRange) {
  (el as any).fcEventRange = eventRange
}

export function getElEventRange(el: HTMLElement): EventRenderRange | null {
  return (el as any).fcEventRange ||
    (el.parentNode as any).fcEventRange || // for the harness
    null
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
  const universalBase = eventUiBases['']
  const defBase = eventUiBases[eventDef.defId]

  if (universalBase) {
    uis.push(universalBase)
  }

  // HACK for background-base
  const universalDisplay = universalBase?.display
  const defDisplay = defBase?.display
  const specificDisplay = eventDef.ui.display
  const eventDisplay =
    universalDisplay && universalDisplay !== 'auto'
      ? universalBase
      : defDisplay && defDisplay !== 'auto'
        ? defDisplay
        : specificDisplay
  if (eventDisplay === 'background' && eventUiBases['__']) {
    uis.push(eventUiBases['__'])
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

// other stuff

export interface MinimalEventProps {
  eventRange: EventRenderRange // timed/whole-day span
  slicedStart?: DateMarker // view-sliced timed/whole-day span
  slicedEnd?: DateMarker // view-sliced timed/whole-day span
  isStart: boolean
  isEnd: boolean
  isDragging: boolean // rename to isMirrorDragging? make optional?
  isResizing: boolean // rename to isMirrorResizing? make optional?
  isMirror: boolean
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
}

export interface EventDisplayData { // for *Content handlers
  event: EventImpl
  timeText: string
  color: string // TODO: add other EventUi props?
  contrastColor: string //
  isDraggable: boolean
  isStartResizable: boolean
  isEndResizable: boolean
  isMirror: boolean
  isStart: boolean
  isEnd: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  isSelected: boolean
  isDragging: boolean
  isResizing: boolean
  view: ViewApi // specifically for the API

  isCompact: boolean
  isSpacious: boolean
  level: number
  timeClassName: string
  titleClassName: string
}

export type EventMountData = MountData<EventDisplayData>

export function computeEventRangeDraggable(eventRange: EventRenderRange, context: ViewContext) {
  let { pluginHooks } = context
  let transformers = pluginHooks.isDraggableTransformers
  let { def, ui } = eventRange
  let val = ui.startEditable

  for (let transformer of transformers) {
    val = transformer(val, def, ui, context)
  }

  return val
}

/*
slicedStart/slicedEnd are optionally supplied to signal where breaks occur in view-specific segment
a better approach is to always slice with dates and always supply this argument,
however, daygrid only slices by row/col
*/
export function buildEventRangeTimeText(
  timeFormat: DateFormatter,
  eventRange: EventRenderRange, // timed/whole-day span
  slicedStart: DateMarker | undefined, // view-sliced timed/whole-day span
  slicedEnd: DateMarker | undefined, // view-sliced timed/whole-day span
  isStart: boolean,
  isEnd: boolean,
  context: ViewContext,
  defaultDisplayEventTime = true,
  defaultDisplayEventEnd = true,
): string {
  const { dateEnv, options } = context
  const { def, instance } = eventRange
  let { displayEventTime, displayEventEnd } = options

  if (displayEventTime == null) { displayEventTime = defaultDisplayEventTime !== false }
  if (displayEventEnd == null) { displayEventEnd = defaultDisplayEventEnd !== false }

  const startDate = (
    !isStart &&
    slicedStart &&
    // if seg is the first seg, but start-date cut-off by slotMinTime, (technically isStart=false)
    // we still want to display the original start-time
    startOfDay(slicedStart).valueOf() !== startOfDay(eventRange.instance.range.start).valueOf()
  )
    ? slicedStart
    : eventRange.instance.range.start

  const endDate = (
    !isEnd &&
    slicedEnd &&
    // See above HACK, but for end-time
    startOfDay(addMs(slicedEnd, -1)).valueOf() !== startOfDay(addMs(eventRange.instance.range.end, -1)).valueOf()
  )
    ? slicedEnd
    : eventRange.instance.range.end

  if (displayEventTime && !def.allDay) {
    if (displayEventEnd && (isStart || isEnd) && def.hasEnd) {
      return dateEnv.formatRange(startDate, endDate, timeFormat, {
        forcedStartTzo: isStart ? instance.forcedStartTzo : null,
        forcedEndTzo: isEnd ? instance.forcedEndTzo : null,
      })
    }

    if (isStart) {
      return dateEnv.format(startDate, timeFormat, {
        forcedTzo: instance.forcedStartTzo,
      })[0]
    }
  }

  return ''
}

export function getEventRangeMeta(
  eventRange: EventRenderRange,
  todayRange: DateRange,
  nowDate?: DateMarker,
) {
  let segRange = eventRange.range

  return {
    isPast: segRange.end <= (nowDate || todayRange.start),
    isFuture: segRange.start >= (nowDate || todayRange.end),
    isToday: todayRange && rangeContainsMarker(todayRange, segRange.start),
  }
}

export function buildEventRangeKey(eventRange: EventRenderRange) {
  return eventRange.instance
    ? eventRange.instance.instanceId
    : `${eventRange.def.defId}:${eventRange.range.start.toISOString()}`
  // inverse-background events don't have specific instances. TODO: better solution
}

export function getEventTagAndAttrs(eventRange: EventRenderRange, context: ViewContext): [
  tag: string,
  attrs: any, // TODO
] {
  let { def, instance } = eventRange
  let { url } = def

  if (url) {
    return ['a', { href: url }]
  }

  let { emitter, options } = context
  let { eventInteractive } = options

  if (eventInteractive == null) {
    eventInteractive = def.interactive
    if (eventInteractive == null) {
      eventInteractive = Boolean(emitter.hasHandlers('eventClick'))
    }
  }

  let attrs: any

  // mock what happens in EventClicking
  if (eventInteractive) {
    // only attach keyboard-related handlers because click handler is already done in EventClicking
    attrs = createAriaKeyboardAttrs((ev: UIEvent) => {
      emitter.trigger('eventClick', {
        el: ev.target as HTMLElement,
        event: new EventImpl(context, def, instance),
        jsEvent: ev as MouseEvent,
        view: context.viewApi,
      })
    })
    attrs = { role: 'button', ...attrs }
  }

  return ['div', attrs]
}
