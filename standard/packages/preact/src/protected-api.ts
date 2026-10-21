
export { CalendarListeners, CalendarListenersRefined, ViewOptionsRefined } from './options/options'
export { Identity, identity, refineProps } from './options/refine'
export { Dictionary } from './util/object'

export type { EventDef, EventDefHash } from './events/event-def'
export type { EventInstanceHash, EventInstanceRange, EventRangeEdge } from './events/event-instance'
export { buildValidInstanceRange, getRangeInstantStartMs, getRangeInstantEndMs } from './events/event-instance'
export type { EventRefined } from './events/event-parse'
export { parseBusinessHours } from './events/business-hours'

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
} from './options/merge'

export {
  computeElIsRtl,
  applyStyleProp,
} from './util/dom-manip'

export type { EventStore } from './events/event-store'
export {
  mergeEventStores,
} from './events/event-store'
export type { EventUiHash, EventUi } from './events/event-ui'
export { combineEventUis, createEventUi } from './events/event-ui'
export type { SplittableProps } from './event-segs/Splitter'
export { Splitter } from './event-segs/Splitter'
export { getDateMeta, DateMeta } from './date-profile/date-meta'
export {
  watchSize,
  watchWidth,
  watchHeight,
  afterSize,
} from './layout/resize-observer'
export { debounce } from './util/debounce'

export { buildNavLinkAttrs } from './views/nav-link'

export {
  computeInnerRect,
  computeEdges,
} from './util/dom-geom'

export { unpromisify } from './util/promise'

export { Emitter } from './util/Emitter'
export type { ViewContext } from './context/ViewContext'
export type { EventSegUiInteractionState } from './interactions/event-interaction-state'
export type { CalendarData } from './store/data-types'
export { createCalendarStore, CalendarStore } from './store/CalendarStore'
export type { CalendarStoreConfig, CalendarStoreChange, CalendarStoreListener } from './store/CalendarStore'
export type { CalendarActions, CalendarActionsCreator } from './api/calendar-actions'
export type { ViewProps } from './views/view-props'

export type { DateProfile } from './date-profile/DateProfileGenerator'
export { DateProfileGenerator, computeMajorUnit, isMajorUnit } from './date-profile/DateProfileGenerator'
export type { DateSpan } from './events/date-span'
export { getDateSpanInstantStartMs, getDateSpanInstantEndMs } from './events/date-span'

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
export type { PointerDragEvent } from './interactions/pointer-types'
export type { Hit } from './interactions/hit'
export type { HitTarget } from './interactions/hit-target'
export type { HitSource } from './interactions/useHitTarget'
export { useHitTarget } from './interactions/useHitTarget'
export { useViewContext } from './context/useViewContext'
export { useCalendarCore, usePluginHooks, useDateEnv, useViewSpec, useViewOptions } from './context/useGranularContexts'
export type { CalendarCore, ViewSpecContextValue } from './context/granular-contexts'
export { useLatest } from './hooks/useLatest'
export { useStableCallback } from './hooks/useStableCallback'
export type { Effect, EffectRunner, EffectRunnerMap, ReduceEffects } from './store/effects'
export type { FetchEventSourceEffect } from './store/run-fetch-event-source'
export { runEventSourceFetch } from './store/run-fetch-event-source'
export type { OptionChangeEffect } from './store/run-option-change'
export { useMeasuredState } from './layout/useMeasuredState'
export { useForwardedElRef } from './hooks/useForwardedElRef'
export type { NowTimerRunnerOutput as Now } from './now/NowTimerRunner'
export { useNow } from './now/useNow'
export { useMountHooks } from './render-hook/useMountHooks'
export type { ReportedSizeInput } from './layout/useReportedSize'
export { useReportedSize } from './layout/useReportedSize'
export type { RenderHookElInput, RenderHookEl } from './render-hook/useRenderHookEl'
export { useRenderHookEl } from './render-hook/useRenderHookEl'
export type { CustomContentProps } from './render-hook/CustomContent'
export { CustomContent } from './render-hook/CustomContent'
export { ElementDragging } from './interactions/ElementDragging'

export { config } from './plugins/global-config'

export type { ViewPropsTransformer } from './plugins/plugin-types'
export type { Action } from './store/actions'
export type { CalendarContext } from './context/CalendarContext'
export type { CalendarContentProps } from './calendar/CalendarInner'
export { CalendarInner } from './calendar/CalendarInner'

export type { EventInteractionState } from './interactions/event-interaction-state'
export { sortEventSegs, buildEventRangeKey, sliceEventStore, EventRangeProps } from './event-segs/event-ranges' // sliceEventStore: for the day-table specs' oracle
export { getEventRangeMeta, MinimalEventProps } from './events/components/event-display-info'

export type { DayTableCell, DayGridRange } from './day-table/day-grid-range'
export { buildDayGridRanges } from './day-table/day-grid-range'
export type { DayCol, DayColSlotRange } from './day-table/model'

// the day-table pipeline (DayGrid, TimeGrid, MultiMonth, the resource views)
export type { DaySeries } from './day-table/day-series'
export { buildDaySeries } from './day-table/day-series'
export type {
  DayTableModel, DayTableColumn, DayTableColumnGroup, DayTableModelConfig,
} from './day-table/model'
export {
  buildDayTableModel, buildModelFromCols, lookUpDayTableCol, computeDayTableColRanges, NO_PARTICIPANTS,
} from './day-table/model'
export type { DayTableKeying, KeylessRules, DayTableLane } from './day-table/keying'
export {
  PLAIN_KEYING, PLAIN_KEYLESS_RULES, DAY_GRID_LANE, TIME_GRID_ALL_DAY_LANE, TIME_GRID_TIMED_LANE,
  isDefInLane, isSpanInLane,
} from './day-table/keying'
export { buildDefKeys, splitIndividualUi, buildEventUiForKey } from './day-table/event-ui-bases'
export type { KeyedCache } from './day-table/keyed-cache'
export { createKeyedCache } from './day-table/keyed-cache'
export type { DayTableRange, DayTableSeg, DayTableEventSegs } from './day-table/slice-ranges'
export {
  sliceDayTableEvents, sliceDayTableBusinessHours, sliceDayTableDateSelection, sliceDayTableInteraction,
  resolveDayTableEventSelection, resolveDayTableLaneEventSelection, sliceRangeToCoords,
} from './day-table/slice-ranges'
export type { DayTableSegCategory } from './day-table/project-segs'
export { projectDayTableSegs, projectDayTableInteraction, getDayTableSegTransform } from './day-table/project-segs'
export { sliceDayTableNowIndicator } from './day-table/now-indicator'
export { useDayTableSegs, useNowIndicatorSegsByCol } from './day-table/useDayTableSegs'
export { useDayGridModel, useTimeGridModel, buildDayGridModel } from './day-table/useDayTableModel'

export { Scroller } from './scrollgrid/Scroller'

export type { SlicedProps } from './event-segs/Slicer'
export { Slicer } from './event-segs/Slicer'

export type { EventMutation } from './events/event-mutation'
export type { Constraint } from './validation/constraint'
export { isPropsValid } from './validation/validation'

export { requestJson } from './util/requestJson'

export { setRef, memoWithEquality } from './util/vdom'
export { createViewComponent } from './views/view-config' // a view's component from its body
export { DelayedRunner } from './util/DelayedRunner'

export {
  getFooterScrollbarSticky,
  getTableHeaderSticky,
  getIsHeightAuto,
} from './scrollgrid/util'

// new
export { ScrollerSyncerInterface } from './scrollgrid/scroller-types'
export { Ruler } from './scrollgrid/Ruler'

export { RefMap } from './util/RefMap'

export { NowTimer } from './now/NowTimer'
export type {
  ContentGenerator, DidMountHandler, WillUnmountHandler, MountInfo,
} from './render-hook/render-hook-types'
export {
  refineClassName,
  refineClassNameGenerator,
} from './render-hook/render-hook-types'
export { ForegroundEvent, rowEventVariant, columnEventVariant, listItemEventVariant } from './events/components/ForegroundEvent'
export type { EventProps, ForegroundEventProps, EventVariant } from './events/components/ForegroundEvent'
export { NowIndicatorHeaderContainer } from './now-indicator/NowIndicatorHeaderContainer'
export { NowIndicatorLineContainer } from './now-indicator/NowIndicatorLineContainer'
export { NowIndicatorDot } from './now-indicator/NowIndicatorDot'

export { renderFill, BgEvent } from './events/components/BgEvent'
export { MoreLinkContainer } from './more-link/MoreLinkContainer'
export { MeasuredHeightHarness } from './layout/MeasuredHeightHarness'

export { ViewContainer } from './views/ViewContainer'

export { CalendarApiImpl } from './api/CalendarApiImpl'
export { EventImpl } from './api/EventImpl'

export { CalendarMediaRoot, computeRootClassName } from './calendar/CalendarMediaRoot'
export { RenderId } from './render-hook/RenderId'

export { generateClassName } from './render-hook/render-hook-types'
export type { CustomRendering } from './render-hook/CustomRenderingStore'
export { CustomRenderingStore } from './render-hook/CustomRenderingStore'

export {
  CoordRange,
  CoordSpan,
  SlicedCoordRange,
} from './event-segs/coord-range'

export { FooterScrollbar } from './scrollgrid/FooterScrollbar'

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

export { TimeGridRange, organizeSegsByCol, splitInteractionByCol } from './day-table/time-grid-range'
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
