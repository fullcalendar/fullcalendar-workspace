export type { CalendarOptions, CalendarListeners, ViewOptions } from '../options.js'
export type { DateInput } from '../datelib/env.js'
export type { DurationInput } from '../datelib/duration.js'
export type { DateSpanInput } from '../structs/date-span.js'
export type { DateRangeInput } from '../datelib/date-range.js'
export type { EventSourceInput } from '../structs/event-source-parse.js'
export type { EventSourceFunc, EventSourceFuncData } from '../event-sources/func-event-source.js'
export type { EventInput, EventInputTransformer } from '../structs/event-parse.js'
export type { FormatterInput } from '../datelib/formatting.js'
export type { CssDimValue } from '../scrollgrid/util.js'
export type { BusinessHoursInput } from '../structs/business-hours.js'
export type { LocaleSingularArg, LocaleInput } from '../datelib/locale.js'
export type { OverlapFunc, ConstraintInput, AllowFunc } from '../structs/constraint.js'
export type { PluginDef, PluginDefInput } from '../plugin-system-struct.js'
export type { ViewComponentType, SpecificViewData, SpecificViewMountData } from '../structs/view-config.js'
export type { ClassNameGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler } from '../common/render-hook.js'
export type { NowIndicatorLabelData, NowIndicatorLabelMountData } from '../common/NowIndicatorLabelContainer.js'
export type { NowIndicatorLineData, NowIndicatorLineMountData } from '../common/NowIndicatorLineContainer.js'
export type {
  InlineWeekNumberData,
  InlineWeekNumberMountData,
  WeekNumberHeaderData,
  WeekNumberHeaderMountData,
  DateTimeFormatPartWithWeek,
} from '../common/WeekNumberContainer.js'
export type { MoreLinkData, MoreLinkMountData } from '../common/MoreLinkContainer.js'
export * from '../common/more-link-public-types.js'
export type {
  SlotLaneData, SlotLaneMountData,
  SlotLabelData, SlotLabelMountData,
  AllDayHeaderData, AllDayHeaderMountData,
  DayHeaderData,
  DayHeaderMountData,
  DayCellData,
  DayCellMountData,
} from '../render-hook-misc.js'
export type { DayLaneData, DayLaneMountData } from '../common/DayLaneContainer.js'
export type { ViewDisplayData, ViewMountData } from '../common/ViewContainer.js'
export type { EventClickData } from '../interactions/EventClicking.js'
export type { EventHoveringData } from '../interactions/EventHovering.js'
export type { DateSelectData, DateUnselectData } from '../calendar-utils.js'
export type { WeekNumberCalculation } from '../datelib/env.js'
export type { ToolbarInput, ButtonInput, ButtonGroupData, ButtonData, ButtonMountData, ButtonIconData, ButtonDisplay, ToolbarElementInput, ToolbarSectionData, ToolbarData } from '../toolbar-struct.js'
export type { EventDisplayData, EventMountData } from '../component-util/event-rendering.js'
export type { DatesSetData } from '../dates-set.js'
export type { EventAddData, EventChangeData, EventDropData, EventRemoveData } from '../event-crud.js'
export type { CustomRenderingHandler, CustomRenderingStore } from '../content-inject/CustomRenderingStore.js'
export type { DateSpanApi, DatePointApi } from '../structs/date-span.js'
export type { DateSelectionApi } from '../calendar-utils.js'
export type { ClassNameInput } from '../util/html.js'
export type { ButtonState, NavButtonState, ButtonStateMap } from '../structs/button-state.js'

// used by some args
export type { Duration } from '../datelib/duration.js'

export interface CalendarDisplayData {
  direction: 'ltr' | 'rtl'
  mediaType: 'screen' | 'print'
}

// TODO: other new "public" exports that should be in an "/api/" file like this?
