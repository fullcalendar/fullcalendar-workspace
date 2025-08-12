import { DateProfileGeneratorClass } from './DateProfileGenerator.js'
import { CalendarApi } from './api/CalendarApi.js'
import { CalendarController } from './CalendarController.js'
import { EventApi } from './api/EventApi.js'
import {
  AllDayHeaderData, AllDayHeaderMountData,
  AllowFunc,
  BusinessHoursInput,
  ButtonInput,
  CalendarDisplayData,
  ClassNameGenerator,
  ConstraintInput,
  CssDimValue,
  CustomContentGenerator,
  CustomRenderingHandler,
  DateInput,
  DateRangeInput,
  DateSelectData,
  DatesSetData,
  DateUnselectData,
  DayLaneData,
  DayLaneMountData,
  DayPopoverData,
  DidMountHandler,
  EventAddData, EventChangeData,
  EventClickData,
  EventDisplayData,
  EventHoveringData,
  EventInput, EventInputTransformer,
  EventMountData,
  EventRemoveData,
  EventSourceInput,
  FormatterInput,
  LocaleInput,
  LocaleSingularArg,
  MoreLinkAction,
  MoreLinkData,
  MoreLinkMountData,
  NowIndicatorLabelData,
  NowIndicatorLabelMountData,
  NowIndicatorLineData,
  NowIndicatorLineMountData,
  OverlapFunc,
  PluginDef,
  SlotLabelData, SlotLabelMountData,
  SlotLaneData, SlotLaneMountData,
  SpecificViewData, SpecificViewMountData,
  ToolbarInput,
  ViewComponentType,
  ViewDisplayData,
  ViewMountData,
  WeekNumberCalculation,
  WeekNumberDisplayData, WeekNumberMountData,
  WillUnmountHandler,
  ButtonData,
  ButtonGroupData,
  ToolbarElementInput,
  ToolbarSectionData,
  ToolbarData,
  ButtonDisplay,
  DayHeaderData,
  DayHeaderMountData,
} from './api/structs.js'
import { TableHeaderData } from './common/TableAndSubsections.js'
import { createDuration, Duration } from './datelib/duration.js'
import { createFormatter } from './datelib/formatting.js'
import { ClassNameInput } from './util/html.js'
import { parseFieldSpecs } from './util/misc.js'
import { isMaybePropsEqualShallow, isMaybePropsEqualDepth1 } from './util/object.js'
import { isMaybeArraysEqual } from './util/array.js'

// base options
// ------------

export const BASE_OPTION_REFINERS = {
  navLinkDayClick: identity as Identity<string | ((this: CalendarApi, date: Date, jsEvent: UIEvent) => void)>,
  navLinkWeekClick: identity as Identity<string | ((this: CalendarApi, weekStart: Date, jsEvent: UIEvent) => void)>,
  duration: createDuration,

  buttons: identity as Identity<{
    today?: ButtonInput
    prev?: ButtonInput
    next?: ButtonInput
    prevYear?: ButtonInput
    nextYear?: ButtonInput
    year?: ButtonInput
    month?: ButtonInput
    week?: ButtonInput
    day?: ButtonInput
    [buttonName: string]: ButtonInput
  }>,
  toolbarElements: identity as Identity<{
    [elementName: string]: ToolbarElementInput
  }>,
  prevText: String,
  nextText: String,
  prevYearText: String,
  nextYearText: String,
  todayText: String,
  yearText: String,
  monthText: String,
  weekText: String,
  weekTextShort: String,
  dayText: String,
  listText: identity as Identity<string | false>,
  todayHint: identity as Identity<string | ((currentUnitText: string, currentUnit: string) => string)>,
  prevHint: identity as Identity<string | ((currentUnitText: string, currentUnit: string) => string)>,
  nextHint: identity as Identity<string | ((currentUnitText: string, currentUnit: string) => string)>,

  buttonDisplay: identity as Identity<ButtonDisplay>,
  buttonGroupClass: identity as Identity<ClassNameGenerator<ButtonGroupData>>,
  buttonClass: identity as Identity<ClassNameGenerator<ButtonData>>,

  defaultAllDayEventDuration: createDuration,
  defaultTimedEventDuration: createDuration,
  nextDayThreshold: createDuration,
  scrollTime: createDuration,
  scrollTimeReset: Boolean,
  slotMinTime: createDuration,
  slotMaxTime: createDuration,
  dayPopoverFormat: createFormatter,
  slotDuration: createDuration,
  snapDuration: createDuration,
  headerToolbar: identity as Identity<ToolbarInput | false>,
  footerToolbar: identity as Identity<ToolbarInput | false>,
  defaultRangeSeparator: String,
  titleRangeSeparator: String,
  forceEventDuration: Boolean,

  // TODO: move to timegrid
  dayLaneClass: identity as Identity<ClassNameGenerator<DayLaneData>>,
  dayLaneInnerClass: identity as Identity<ClassNameGenerator<DayLaneData>>,
  dayLaneDidMount: identity as Identity<DidMountHandler<DayLaneMountData>>,
  dayLaneWillUnmount: identity as Identity<WillUnmountHandler<DayLaneMountData>>,

  initialView: String,
  aspectRatio: Number,
  weekends: Boolean,

  weekNumberCalculation: identity as Identity<WeekNumberCalculation>,
  weekNumbers: Boolean,
  weekNumberClass: identity as Identity<ClassNameGenerator<WeekNumberDisplayData>>,
  weekNumberInnerClass: identity as Identity<ClassNameGenerator<WeekNumberDisplayData>>,
  weekNumberContent: identity as Identity<CustomContentGenerator<WeekNumberDisplayData>>,
  weekNumberDidMount: identity as Identity<DidMountHandler<WeekNumberMountData>>,
  weekNumberWillUnmount: identity as Identity<WillUnmountHandler<WeekNumberMountData>>,

  editable: Boolean,

  controller: identity as Identity<CalendarController>,

  viewClass: identity as Identity<ClassNameGenerator<ViewDisplayData>>,
  viewDidMount: identity as Identity<DidMountHandler<ViewMountData>>,
  viewWillUnmount: identity as Identity<WillUnmountHandler<ViewMountData>>,

  nowIndicator: Boolean,

  nowIndicatorLabelClass: identity as Identity<ClassNameGenerator<NowIndicatorLabelData>>,
  nowIndicatorLabelContent: identity as Identity<CustomContentGenerator<NowIndicatorLabelData>>,
  nowIndicatorLabelDidMount: identity as Identity<DidMountHandler<NowIndicatorLabelMountData>>,
  nowIndicatorLabelWillUnmount: identity as Identity<WillUnmountHandler<NowIndicatorLabelMountData>>,

  nowIndicatorDotClass: identity as Identity<ClassNameInput>,

  nowIndicatorLineClass: identity as Identity<ClassNameGenerator<NowIndicatorLineData>>,
  nowIndicatorLineContent: identity as Identity<CustomContentGenerator<NowIndicatorLineData>>,
  nowIndicatorLineDidMount: identity as Identity<DidMountHandler<NowIndicatorLineMountData>>,
  nowIndicatorLineWillUnmount: identity as Identity<WillUnmountHandler<NowIndicatorLineMountData>>,

  showNonCurrentDates: Boolean,
  lazyFetching: Boolean,
  startParam: String,
  endParam: String,
  timeZoneParam: String,
  timeZone: String,
  locales: identity as Identity<LocaleInput[]>,
  locale: identity as Identity<LocaleSingularArg>,
  dragRevertDuration: Number,
  dragScroll: Boolean,
  allDayMaintainDuration: Boolean,
  unselectAuto: Boolean,
  dropAccept: identity as Identity<string | ((this: CalendarApi, draggable: any) => boolean)>, // TODO: type draggable
  eventOrder: parseFieldSpecs,
  eventOrderStrict: Boolean,
  eventSlicing: Boolean, // default: true

  longPressDelay: Number,
  eventDragMinDistance: Number,
  expandRows: Boolean,
  height: identity as Identity<CssDimValue>,
  contentHeight: identity as Identity<CssDimValue>,
  direction: String as Identity<'ltr' | 'rtl'>,
  weekNumberFormat: createFormatter,
  eventResizableFromStart: Boolean,
  displayEventTime: Boolean,
  displayEventEnd: Boolean,
  progressiveEventRendering: Boolean,
  businessHours: identity as Identity<BusinessHoursInput>,
  initialDate: identity as Identity<DateInput>,
  now: identity as Identity<DateInput | ((this: CalendarApi) => DateInput)>,
  eventDataTransform: identity as Identity<EventInputTransformer>,
  stickyHeaderDates: identity as Identity<boolean | 'auto'>,
  stickyFooterScrollbar: identity as Identity<boolean | 'auto'>,
  defaultAllDay: Boolean,
  eventSourceFailure: identity as Identity<(this: CalendarApi, error: any) => void>,
  eventSourceSuccess: identity as Identity<(this: CalendarApi, eventsInput: EventInput[], response?: Response) => EventInput[] | void>,

  eventDisplay: String, // TODO: give more specific
  eventStartEditable: Boolean,
  eventDurationEditable: Boolean,
  eventOverlap: identity as Identity<boolean | OverlapFunc>,
  eventConstraint: identity as Identity<ConstraintInput>,
  eventAllow: identity as Identity<AllowFunc>,
  eventColor: String,
  eventContrastColor: String,
  eventDidMount: identity as Identity<DidMountHandler<EventMountData>>,
  eventWillUnmount: identity as Identity<WillUnmountHandler<EventMountData>>,
  eventContent: identity as Identity<CustomContentGenerator<EventDisplayData>>,

  backgroundEventColor: String,

  eventClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  eventColorClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  eventInnerClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  eventTimeClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  eventTitleClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  eventBeforeClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  eventAfterClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  //
  listItemEventClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  listItemEventColorClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  listItemEventInnerClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  listItemEventTimeClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  listItemEventTitleClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  listItemEventBeforeClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  listItemEventAfterClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  //
  blockEventClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  blockEventColorClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  blockEventInnerClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  blockEventTimeClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  blockEventTitleClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  blockEventBeforeClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  blockEventAfterClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  //
  rowEventClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  rowEventColorClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  rowEventInnerClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  rowEventTimeClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  rowEventTitleClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  rowEventTitleSticky: Boolean,
  rowEventBeforeClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  rowEventAfterClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  //
  columnEventClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  columnEventColorClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  columnEventInnerClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  columnEventTimeClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  columnEventTitleClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  columnEventTitleSticky: Boolean,
  columnEventBeforeClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  columnEventAfterClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  //
  backgroundEventClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  backgroundEventColorClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  backgroundEventInnerClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  backgroundEventTimeClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  backgroundEventTitleClass: identity as Identity<ClassNameGenerator<{ event: EventApi, isCompact: boolean }>>,
  backgroundEventBeforeClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,
  backgroundEventAfterClass: identity as Identity<ClassNameGenerator<EventDisplayData>>,

  selectConstraint: identity as Identity<ConstraintInput>,
  selectOverlap: identity as Identity<boolean | OverlapFunc>,
  selectAllow: identity as Identity<AllowFunc>,

  droppable: Boolean,
  unselectCancel: String,

  slotLabelFormat: identity as Identity<FormatterInput | FormatterInput[]>,

  slotLaneClass: identity as Identity<ClassNameGenerator<SlotLaneData>>,
  slotLaneDidMount: identity as Identity<DidMountHandler<SlotLaneMountData>>,
  slotLaneWillUnmount: identity as Identity<WillUnmountHandler<SlotLaneMountData>>,

  slotLabelClass: identity as Identity<ClassNameGenerator<SlotLabelData>>,
  slotLabelInnerClass: identity as Identity<ClassNameGenerator<SlotLabelData>>,
  slotLabelContent: identity as Identity<CustomContentGenerator<SlotLabelData>>,
  slotLabelDidMount: identity as Identity<DidMountHandler<SlotLabelMountData>>,
  slotLabelWillUnmount: identity as Identity<WillUnmountHandler<SlotLabelMountData>>,

  slotLabelAlign: identity as Identity<'start' | 'center' | 'end'>,
  slotLabelSticky: identity as Identity<boolean | number | string>,

  slotLabelRowClass: identity as Identity<ClassNameInput>,
  slotLabelDividerClass: identity as Identity<ClassNameGenerator<{ isHeader: boolean }>>,

  dayMaxEvents: identity as Identity<boolean | number>,
  dayMaxEventRows: identity as Identity<boolean | number>,
  dayMinWidth: Number,
  slotLabelInterval: createDuration,

  dayHeaderClass: identity as Identity<ClassNameGenerator<DayHeaderData>>,
  dayHeaderInnerClass: identity as Identity<ClassNameGenerator<DayHeaderData>>,
  dayHeaderContent: identity as Identity<CustomContentGenerator<DayHeaderData>>,
  dayHeaderDidMount: identity as Identity<DidMountHandler<DayHeaderMountData>>,
  dayHeaderWillUnmount: identity as Identity<WillUnmountHandler<DayHeaderMountData>>,

  allDayText: String,
  allDayHeaderClass: identity as Identity<ClassNameGenerator<AllDayHeaderData>>,
  allDayHeaderInnerClass: identity as Identity<ClassNameGenerator<AllDayHeaderData>>,
  allDayHeaderContent: identity as Identity<CustomContentGenerator<AllDayHeaderData>>,
  allDayHeaderDidMount: identity as Identity<DidMountHandler<AllDayHeaderMountData>>,
  allDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<AllDayHeaderMountData>>,

  timedText: String,

  slotMinWidth: Number, // move to timeline?
  navLinks: Boolean,
  eventTimeFormat: createFormatter,
  rerenderDelay: Number, // TODO: move to @fullcalendar/core right? nah keep here
  moreLinkText: identity as Identity<string | ((this: CalendarApi, num: number) => string)>, // this not enforced :( check others too
  moreLinkHint: identity as Identity<string | ((this: CalendarApi, num: number) => string)>,
  selectMinDistance: Number,
  selectable: Boolean,
  selectLongPressDelay: Number,
  eventLongPressDelay: Number,

  selectMirror: Boolean,
  eventMaxStack: Number,
  eventMinHeight: Number,
  eventMinWidth: Number,
  eventCompactHeight: Number,
  slotEventOverlap: Boolean,
  plugins: identity as Identity<PluginDef[]>,
  firstDay: Number,
  dayCount: Number,
  dateAlignment: String,
  dateIncrement: createDuration,
  hiddenDays: identity as Identity<number[]>,
  fixedWeekCount: Boolean,
  validRange: identity as Identity<DateRangeInput | ((this: CalendarApi, nowDate: Date) => DateRangeInput)>, // `this` works?
  visibleRange: identity as Identity<DateRangeInput | ((this: CalendarApi, currentDate: Date) => DateRangeInput)>, // `this` works?
  titleFormat: identity as Identity<FormatterInput>, // DONT parse just yet. we need to inject titleSeparator

  eventInteractive: Boolean,

  // only used by list-view, but languages define the value, so we need it in base options
  noEventsText: String,

  viewHint: identity as Identity<string | ((viewButtonText: string, viewName: string) => string)>,
  viewChangeHint: String, // for the tab container
  navLinkHint: identity as Identity<string | ((dateText: string, date: Date) => string)>,
  closeHint: String,
  eventsHint: String,

  headingLevel: Number,

  moreLinkClick: identity as Identity<MoreLinkAction>,
  moreLinkContent: identity as Identity<CustomContentGenerator<MoreLinkData>>,
  moreLinkDidMount: identity as Identity<DidMountHandler<MoreLinkMountData>>,
  moreLinkWillUnmount: identity as Identity<WillUnmountHandler<MoreLinkMountData>>,
  moreLinkClass: identity as Identity<ClassNameGenerator<MoreLinkData>>,
  moreLinkInnerClass: identity as Identity<ClassNameGenerator<MoreLinkData>>,
  //
  rowMoreLinkClass: identity as Identity<ClassNameGenerator<MoreLinkData>>,
  rowMoreLinkInnerClass: identity as Identity<ClassNameGenerator<MoreLinkData>>,
  //
  columnMoreLinkClass: identity as Identity<ClassNameGenerator<MoreLinkData>>,
  columnMoreLinkInnerClass: identity as Identity<ClassNameGenerator<MoreLinkData>>,

  navLinkClass: identity as Identity<ClassNameInput>,

  monthStartFormat: createFormatter,
  dayCellFormat: createFormatter,

  // for connectors
  // (can't be part of plugin system b/c must be provided at runtime)
  handleCustomRendering: identity as Identity<CustomRenderingHandler<any>>,
  customRenderingMetaMap: identity as Identity<{ [optionName: string]: any }>,
  customRenderingReplaces: Boolean,

  // new
  class: identity as Identity<ClassNameGenerator<CalendarDisplayData>>,
  className: identity as Identity<ClassNameGenerator<CalendarDisplayData>>,
  dayPopoverClass: identity as Identity<ClassNameGenerator<DayPopoverData>>,
  popoverClass: identity as Identity<ClassNameInput>,
  popoverHeaderClass: identity as Identity<ClassNameInput>,
  popoverCloseClass: identity as Identity<ClassNameInput>,
  popoverCloseContent: identity as Identity<CustomContentGenerator<{}>>,
  popoverBodyClass: identity as Identity<ClassNameInput>,
  dayCompactWidth: Number,

  borderless: Boolean,
  borderlessX: Boolean,
  borderlessTop: Boolean,
  borderlessBottom: Boolean,

  fillerClass: identity as Identity<ClassNameGenerator<{ isHeader: boolean }>>,

  headerToolbarClass: identity as Identity<ClassNameGenerator<ToolbarData>>,
  footerToolbarClass: identity as Identity<ClassNameGenerator<ToolbarData>>,
  toolbarClass: identity as Identity<ClassNameGenerator<ToolbarData>>,
  toolbarSectionClass: identity as Identity<ClassNameGenerator<ToolbarSectionData>>,
  toolbarTitleClass: identity as Identity<ClassNameInput>,

  tableClass: identity as Identity<ClassNameInput>,
  tableHeaderClass: identity as Identity<ClassNameGenerator<TableHeaderData>>,
  tableBodyClass: identity as Identity<ClassNameInput>,

  nonBusinessClass: identity as Identity<ClassNameInput>,
  highlightClass: identity as Identity<ClassNameInput>,
}

type BaseOptionRefiners = typeof BASE_OPTION_REFINERS

export interface BaseOptions extends RawOptionsFromRefiners<BaseOptionRefiners> {
  // for ambient extending
}

export interface BaseOptionsRefined extends RefinedOptionsFromRefiners<BaseOptionRefiners> {
  // for ambient extending
}

// do NOT give a type here. need `typeof BASE_OPTION_DEFAULTS` to give real results.
// raw values.
export const BASE_OPTION_DEFAULTS = {
  buttonDisplay: 'auto',
  eventDisplay: 'auto',
  defaultRangeSeparator: ' - ',
  titleRangeSeparator: ' \u2013 ', // en dash
  defaultTimedEventDuration: '01:00:00',
  defaultAllDayEventDuration: { day: 1 },
  forceEventDuration: false,
  nextDayThreshold: '00:00:00',
  initialView: '',
  aspectRatio: 1.35,
  weekends: true,
  weekNumbers: false,
  weekNumberCalculation: 'local' as WeekNumberCalculation,
  editable: false,
  nowIndicator: false,
  scrollTime: '06:00:00',
  scrollTimeReset: true,
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',
  showNonCurrentDates: true,
  lazyFetching: true,
  startParam: 'start',
  endParam: 'end',
  timeZoneParam: 'timeZone',
  timeZone: 'local', // TODO: throw error if given falsy value?
  locales: [],
  locale: '', // blank values means it will compute based off locales[]
  dragRevertDuration: 500,
  dragScroll: true,
  allDayMaintainDuration: false,
  unselectAuto: true,
  dropAccept: '*',
  eventOrder: 'start,-duration,allDay,title',
  dayPopoverFormat: { month: 'long', day: 'numeric', year: 'numeric' },
  longPressDelay: 1000,
  eventDragMinDistance: 5, // only applies to mouse
  expandRows: false,
  navLinks: false,
  selectable: false,
  eventMinHeight: 15,
  eventMinWidth: 30,
  eventCompactHeight: 30,
  monthStartFormat: { month: 'long', day: 'numeric' },
  dayCellFormat: { day: 'numeric' },
  headingLevel: 2, // like H2
  outerBorder: true,
  dayCompactWidth: 75,
  eventOverlap: true,
  slotLabelAlign: 'start',
  slotLabelSticky: true,
  rowEventTitleSticky: true,
  columnEventTitleSticky: true,
}

// calendar listeners
// ------------------

export const CALENDAR_LISTENER_REFINERS = {
  datesSet: identity as Identity<(data: DatesSetData) => void>,
  eventsSet: identity as Identity<(events: EventApi[]) => void>,
  eventAdd: identity as Identity<(data: EventAddData) => void>,
  eventChange: identity as Identity<(data: EventChangeData) => void>,
  eventRemove: identity as Identity<(data: EventRemoveData) => void>,
  eventClick: identity as Identity<(data: EventClickData) => void>, // TODO: resource for scheduler????
  eventMouseEnter: identity as Identity<(data: EventHoveringData) => void>,
  eventMouseLeave: identity as Identity<(data: EventHoveringData) => void>,
  select: identity as Identity<(data: DateSelectData) => void>, // resource for scheduler????
  unselect: identity as Identity<(data: DateUnselectData) => void>,
  loading: identity as Identity<(isLoading: boolean) => void>,

  // internal
  _unmount: identity as Identity<() => void>,
  _beforeprint: identity as Identity<() => void>,
  _afterprint: identity as Identity<() => void>,
  _noEventDrop: identity as Identity<() => void>,
  _noEventResize: identity as Identity<() => void>,
  _timeScrollRequest: identity as Identity<(time: Duration) => void>,
}

type CalendarListenerRefiners = typeof CALENDAR_LISTENER_REFINERS

export interface CalendarListeners extends RawOptionsFromRefiners<CalendarListenerRefiners> {
  // for ambient extending
}

export interface CalendarListenersRefined extends RefinedOptionsFromRefiners<CalendarListenerRefiners> {
  // for ambient extending
}

// calendar-only options (not for view-specific)
// ---------------------------------------------

export const CALENDAR_ONLY_OPTION_REFINERS = { // does not include base nor calendar listeners
  views: identity as Identity<{ [viewId: string]: ViewOptions }>,
  plugins: identity as Identity<PluginDef[]>,
  initialEvents: identity as Identity<EventSourceInput>,
  events: identity as Identity<EventSourceInput>,
  eventSources: identity as Identity<EventSourceInput[]>,
}

type CalendarOnlyOptionRefiners = typeof CALENDAR_ONLY_OPTION_REFINERS
type CalendarOnlyOptions = RawOptionsFromRefiners<CalendarOnlyOptionRefiners>
type CalendarOnlyOptionsRefined = RefinedOptionsFromRefiners<CalendarOnlyOptionRefiners>

// view-specific options
// ---------------------

export const VIEW_ONLY_OPTION_REFINERS: {
  [name: string]: any
} = {
  type: String,
  component: identity as Identity<ViewComponentType>,
  buttonTextKey: String, // internal only
  dateProfileGeneratorClass: identity as Identity<DateProfileGeneratorClass>,
  usesMinMaxTime: Boolean, // internal only

  // TODO: move over to view* prefix? will align with view* options like viewClass
  class: identity as Identity<ClassNameGenerator<SpecificViewData>>,
  className: identity as Identity<ClassNameGenerator<SpecificViewData>>,
  content: identity as Identity<CustomContentGenerator<SpecificViewData>>,
  didMount: identity as Identity<DidMountHandler<SpecificViewMountData>>,
  willUnmount: identity as Identity<WillUnmountHandler<SpecificViewMountData>>,
}

type ViewOnlyRefiners = typeof VIEW_ONLY_OPTION_REFINERS
type ViewOnlyOptions = RawOptionsFromRefiners<ViewOnlyRefiners>
type ViewOnlyOptionsRefined = RefinedOptionsFromRefiners<ViewOnlyRefiners>

export type ViewOptions =
  BaseOptions &
  CalendarListeners &
  ViewOnlyOptions

export type ViewOptionsRefined =
  BaseOptionsRefined &
  CalendarListenersRefined &
  ViewOnlyOptionsRefined

// top-level calendar options
// --------------------------

export type CalendarOptions =
  BaseOptions &
  CalendarListeners &
  CalendarOnlyOptions

export type CalendarOptionsRefined =
  BaseOptionsRefined &
  CalendarListenersRefined &
  CalendarOnlyOptionsRefined

export const COMPLEX_OPTION_COMPARATORS: {
  [optionName in keyof CalendarOptions]: (a: CalendarOptions[optionName], b: CalendarOptions[optionName]) => boolean
} = {
  // Unfortunately always need 'maybe' to handle undefined inital value, because of CalendarDataManager
  headerToolbar: isMaybePropsEqualShallow,
  footerToolbar: isMaybePropsEqualShallow,
  dateIncrement: isMaybePropsEqualShallow,
  buttons: isMaybePropsEqualDepth1,
  plugins: isMaybeArraysEqual,
  events: isMaybeArraysEqual,
  eventSources: isMaybeArraysEqual,
  ['resources' as any]: isMaybeArraysEqual,
}

// util funcs
// ----------------------------------------------------------------------------------------------------

export function refineProps<Refiners extends GenericRefiners, Raw extends RawOptionsFromRefiners<Refiners>>(
  input: Raw,
  refiners: Refiners,
): {
  refined: RefinedOptionsFromRefiners<Refiners>,
  extra: Dictionary,
} {
  let refined = {} as any
  let extra = {} as any

  for (let propName in refiners) {
    if (propName in input) {
      refined[propName] = refiners[propName](input[propName])
    }
  }

  for (let propName in input) {
    if (!(propName in refiners)) {
      extra[propName] = input[propName]
    }
  }

  return { refined, extra }
}

// definition utils
// ----------------------------------------------------------------------------------------------------

export type GenericRefiners = {
  [propName: string]: (input: any) => any
}

export type GenericListenerRefiners = {
  [listenerName: string]: Identity<(this: CalendarApi, ...args: any[]) => void>
}

export type RawOptionsFromRefiners<Refiners extends GenericRefiners> = {
  [Prop in keyof Refiners]?: // all optional
    Refiners[Prop] extends ((input: infer RawType) => infer RefinedType)
      ? (any extends RawType ? RefinedType : RawType) // if input type `any`, use output (for Boolean/Number/String)
      : never
}

export type RefinedOptionsFromRefiners<Refiners extends GenericRefiners> = {
  [Prop in keyof Refiners]?: // all optional
    Refiners[Prop] extends ((input: any) => infer RefinedType) ? RefinedType : never
}

export type DefaultedRefinedOptions<RefinedOptions extends Dictionary, DefaultKey extends keyof RefinedOptions> =
  Required<Pick<RefinedOptions, DefaultKey>> &
  Partial<Omit<RefinedOptions, DefaultKey>>

// lang utils
// ----------------------------------------------------------------------------------------------------

export type Dictionary = Record<string, any>

export type Identity<T = any> = (raw: T) => T

export function identity<T>(raw: T): T {
  return raw
}
