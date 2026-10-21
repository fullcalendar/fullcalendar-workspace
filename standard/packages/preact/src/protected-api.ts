
export {
  CalendarListeners,
  CalendarListenersRefined,
  ViewOptionsRefined,
  Identity,
  Dictionary,
  identity,
  refineProps,
} from './options'

export type { EventDef, EventDefHash } from './structs/event-def'
export type { EventInstanceHash, EventInstanceRange, EventRangeEdge } from './structs/event-instance'
export { buildValidInstanceRange, getRangeInstantStartMs, getRangeInstantEndMs } from './structs/event-instance'
export type { EventRefined } from './structs/event-parse'
export { parseBusinessHours } from './structs/business-hours'

export type { OrderSpec } from './util/misc'
export {
  parseFieldSpecs,
  compareByFieldSpecs,
  flexibleCompare,
  guid,
  computeViewBorderless,
} from './util/misc'
export { warn } from './util/warn'

export {
  computeVisibleDayRange,
} from './util/date'

export {
  removeExact,
  isArraysEqual,
} from './util/array'

export { memoize, memoizeObjArg } from './util/memoize'

export {
  getRectCenter,
} from './util/geom'

export {
  mapHash, filterHash, isPropsEqualShallow,
} from './util/object'

export {
  joinFuncishClassNames,
  mergeContentInjectors,
  mergeLifecycleCallbacks,
  mergeCalendarOptions,
  mergeViewOptionsMap,
} from './options-manip'

export {
  computeElIsRtl,
  applyStyleProp,
} from './util/dom-manip'

export type { EventStore } from './structs/event-store'
export {
  mergeEventStores,
} from './structs/event-store'
export type { EventUiHash, EventUi } from './component-util/event-ui'
export { combineEventUis, createEventUi } from './component-util/event-ui'
export type { SplittableProps } from './component-util/event-splitting'
export { Splitter } from './component-util/event-splitting'
export { getDateMeta, DateMeta } from './component-util/date-rendering'
export {
  watchSize,
  watchWidth,
  watchHeight,
  afterSize,
} from './component-util/resize-observer'
export { debounce } from './util/debounce'

export { buildNavLinkAttrs } from './common/nav-link'

export {
  computeInnerRect,
  computeEdges,
} from './util/dom-geom'

export { unpromisify } from './util/promise'

export { Emitter } from './common/Emitter'
export type { ViewContext } from './ViewContext'
export type { EventSegUiInteractionState } from './interactions/event-interaction-state'
export type { CalendarData } from './reducers/data-types'
export { createCalendarStore, CalendarStore } from './reducers/store'
export type { CalendarStoreConfig, CalendarStoreChange, CalendarStoreListener } from './reducers/store'
export type { CalendarActions, CalendarActionsCreator } from './api/calendar-actions'
export type { ViewProps } from './component-util/View'

export type { DateProfile } from './DateProfileGenerator'
export { DateProfileGenerator, computeMajorUnit, isMajorUnit } from './DateProfileGenerator'
export type { DateSpan } from './structs/date-span'
export { getDateSpanInstantStartMs, getDateSpanInstantEndMs } from './structs/date-span'

// Shared seg-placement engine. Only what premium Timeline consumes is exposed.
export type {
  HiddenSliceGroup,
  Slice,
  SourceSeg,
} from './seg-placement/kernel'
export {
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  buildLevelLimitedLayout,
  computeLateralSpanBottom,
  getSliceKey,
  groupLaterallyIntersecting,
  sortByAxisOrder,
} from './seg-placement/kernel'
export type {
  PrintCandidatePlan,
  PrintEventBand,
  PrintMoreLinkBand,
} from './seg-placement/print'
export {
  buildPrintEventBands,
  planPrintDomCandidates,
  buildPrintMoreLinkBand,
} from './seg-placement/print'
export type { PointerDragEvent } from './interactions/pointer'
export type { Hit } from './interactions/hit'
export type { HitTarget } from './interactions/hit-target'
export type { HitSource } from './hooks/useHitTarget'
export { useHitTarget } from './hooks/useHitTarget'
export { useViewContext } from './hooks/useViewContext'
export { useCalendarCore, usePluginHooks, useDateEnv, useViewSpec, useViewOptions } from './hooks/useGranularContexts'
export type { CalendarCore, ViewSpecContextValue } from './granular-contexts'
export { useLatest } from './hooks/useLatest'
export { useStableCallback } from './hooks/useStableCallback'
export type { Effect, EffectRunner, EffectRunnerMap, ReduceEffects } from './reducers/effects'
export type { FetchEventSourceEffect } from './reducers/event-source-fetch'
export { runEventSourceFetch } from './reducers/event-source-fetch'
export type { OptionChangeEffect } from './reducers/option-change'
export { useMeasuredState } from './hooks/useMeasuredState'
export { useForwardedElRef } from './hooks/useForwardedElRef'
export type { NowTimerRunnerOutput as Now } from './NowTimerRunner'
export { useNow } from './hooks/useNow'
export { useMountHooks } from './hooks/useMountHooks'
export type { ReportedSizeInput } from './hooks/useReportedSize'
export { useReportedSize } from './hooks/useReportedSize'
export type { RenderHookElInput, RenderHookEl } from './hooks/useRenderHookEl'
export { useRenderHookEl } from './hooks/useRenderHookEl'
export type { CustomContentProps } from './content-inject/CustomContent'
export { CustomContent } from './content-inject/CustomContent'
export { ElementDragging } from './interactions/ElementDragging'

export { config } from './global-config'

export type { ViewPropsTransformer } from './plugin-system-struct'
export type { Action } from './reducers/Action'
export type { CalendarContext } from './CalendarContext'
export type { CalendarContentProps } from './CalendarInner'
export { CalendarInner } from './CalendarInner'

export type { EventInteractionState } from './interactions/event-interaction-state'
export {
  sortEventSegs,
  getEventRangeMeta, buildEventRangeKey,
  sliceEventStore, // for the day-table pipeline's specs (an oracle)
  EventRangeProps,
  MinimalEventProps,
} from './component-util/event-rendering'

export type { DayTableCell, DayGridRange } from './daygrid/DayTableModel'
export { buildDayGridRanges } from './daygrid/DayTableModel'
export type { DayCol, DayColSlotRange } from './common/day-cols'

// the day-table pipeline (DayGrid, TimeGrid, MultiMonth, the resource views)
export type { DaySeries } from './common/day-table/day-series'
export { buildDaySeries } from './common/day-table/day-series'
export type {
  DayTableModel, DayTableColumn, DayTableColumnGroup, DayTableModelConfig,
} from './common/day-table/model'
export {
  buildDayTableModel, buildModelFromCols, lookUpDayTableCol, computeDayTableColRanges, NO_PARTICIPANTS,
} from './common/day-table/model'
export type { DayTableKeying, KeylessRules, DayTableLane } from './common/day-table/keying'
export {
  PLAIN_KEYING, PLAIN_KEYLESS_RULES, DAY_GRID_LANE, TIME_GRID_ALL_DAY_LANE, TIME_GRID_TIMED_LANE,
  isDefInLane, isSpanInLane,
} from './common/day-table/keying'
export { buildDefKeys, splitIndividualUi, buildEventUiForKey } from './common/day-table/event-ui-bases'
export type { KeyedCache } from './common/day-table/keyed-cache'
export { createKeyedCache } from './common/day-table/keyed-cache'
export type { DayTableRange, DayTableSeg, DayTableEventSegs } from './common/day-table/slice-ranges'
export {
  sliceDayTableEvents, sliceDayTableBusinessHours, sliceDayTableDateSelection, sliceDayTableInteraction,
  resolveDayTableEventSelection, resolveDayTableLaneEventSelection, sliceRangeToCoords,
} from './common/day-table/slice-ranges'
export type { DayTableSegCategory } from './common/day-table/project'
export { projectDayTableSegs, projectDayTableInteraction, getDayTableSegTransform } from './common/day-table/project'
export { sliceDayTableNowIndicator } from './common/day-table/now-indicator'
export { useDayTableSegs, useNowIndicatorSegsByCol } from './common/day-table/useDayTableSegs'
export { useDayGridModel, useTimeGridModel, buildDayGridModel } from './common/day-table/useDayTableModel'

export { Scroller } from './scrollgrid/Scroller'

export type { SlicedProps } from './common/slicing-utils'
export { Slicer } from './common/slicing-utils'

export type { EventMutation } from './structs/event-mutation'
export type { Constraint } from './structs/constraint'
export { isPropsValid } from './validation'

export { requestJson } from './util/requestJson'

export { setRef, memoWithEquality } from './vdom-util'
export { createViewComponent } from './structs/view-config' // a view's component from its body
export { DelayedRunner } from './util/DelayedRunner'

export {
  getFooterScrollbarSticky,
  getTableHeaderSticky,
  getIsHeightAuto,
} from './scrollgrid/util'

// new
export { ScrollerSyncerInterface } from './scrollgrid/ScrollerSyncerInterface'
export { Ruler } from './scrollgrid/Ruler'

export { RefMap } from './util/RefMap'

export { NowTimer } from './NowTimer'
export type {
  ContentGenerator, DidMountHandler, WillUnmountHandler, MountInfo,
} from './common/render-hook'
export {
  refineClassName,
  refineClassNameGenerator,
} from './common/render-hook'
export { ForegroundEvent, rowEventVariant, columnEventVariant, listItemEventVariant } from './common/events'
export type { EventProps, ForegroundEventProps, EventVariant } from './common/events'
export { NowIndicatorHeaderContainer } from './common/NowIndicatorHeaderContainer'
export { NowIndicatorLineContainer } from './common/NowIndicatorLineContainer'
export { NowIndicatorDot } from './common/NowIndicatorDot'

export { renderFill, BgEvent } from './common/bg-fill'
export { MoreLinkContainer } from './common/MoreLinkContainer'
export { MeasuredHeightHarness } from './common/MeasuredHeightHarness'

export { ViewContainer } from './common/ViewContainer'

export { CalendarApiImpl } from './api/CalendarApiImpl'
export { EventImpl } from './api/EventImpl'

export { CalendarMediaRoot, computeRootClassName } from './calendar-root'
export { RenderId } from './content-inject/RenderId'

export { generateClassName } from './common/render-hook'
export type { CustomRendering } from './content-inject/CustomRenderingStore'
export { CustomRenderingStore } from './content-inject/CustomRenderingStore'

export {
  CoordRange,
  CoordSpan,
  SlicedCoordRange,
} from './coord-range'

export { FooterScrollbar } from './common/FooterScrollbar'

export { createFormatter } from './datelib/formatting'

export type { DateRange, DateMarker, DateFormatter } from '@full-ui/headless-calendar'
export {
  rangeContainsMarker, intersectRanges, rangesEqual, rangesIntersect,
  addDays, startOfDay, addMs, diffWholeWeeks, diffWholeDays, diffDayAndTime, isValidDate,
  createDuration, asCleanDays, multiplyDuration, asRoughMinutes, asRoughSeconds, asRoughMs, wholeDivideDurations, greatestDurationDenominator,
  DateEnv,
  formatDayString,
  parseMarker,
  padStart, isInt,
  asRoughDays, constrainMarkerToRange, parseRange, addWeeks, diffWeeks, // for the date-profile oracle's frozen copy
} from '@full-ui/headless-calendar'

export { TimeGridRange, organizeSegsByCol, splitInteractionByCol } from './timegrid/TimeColsSeg'
export { TimeGridLayout } from './timegrid/components/TimeGridLayout'
export type { TimedSegs, TimedSegsByCol } from './timegrid/components/useTimedSegsByCol'
export { useTimedSegsByCol } from './timegrid/components/useTimedSegsByCol'

export {
  CellRenderConfig,
  CellDataConfig,
  RowConfig,
  buildDateRowConfig,
  buildDateRenderConfig,
  buildDateDataConfigs,
} from './daygrid/header-tier'
export { createDayHeaderFormatter } from './daygrid/components/util'
export { DayGridLayout } from './daygrid/components/DayGridLayout'
export type { DayGridViewData } from './daygrid/components/useDayGridViewData'
export { useDayGridViewData, useDayHeaderFormatter } from './daygrid/components/useDayGridViewData'

export { computeTimeGridPrintMode } from './timegrid/print-mode'
