import { DateProfileGeneratorClass } from './DateProfileGenerator.js'
import { CalendarApi } from './api/CalendarApi.js'
import { EventApi } from './api/EventApi.js'
import {
  AllDayHeaderData, AllDayHeaderMountData,
  AllowFunc,
  BusinessHoursInput,
  ButtonInput,
  ClassNamesGenerator,
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
  ViewData,
  ViewMountData,
  WeekNumberCalculation,
  WeekNumberDisplayData, WeekNumberMountData,
  WillUnmountHandler,
  ButtonData,
  ToolbarElementInput,
  ToolbarSectionData,
  ToolbarData,
  ButtonDisplay,
} from './api/structs.js'
import { ViewBodyData, ViewHeaderData } from './common/ViewSubsections.js'
import { createDuration, Duration } from './datelib/duration.js'
import { createFormatter } from './datelib/formatting.js'
import { ClassNamesInput } from './util/html.js'
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
  buttonGroupClass: identity as Identity<ClassNamesInput>,
  buttonClass: identity as Identity<ClassNamesGenerator<ButtonData>>,

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
  dayLaneClass: identity as Identity<ClassNamesGenerator<DayLaneData>>,
  dayLaneInnerClass: identity as Identity<ClassNamesGenerator<DayLaneData>>,
  dayLaneContent: identity as Identity<CustomContentGenerator<DayLaneData>>,
  dayLaneDidMount: identity as Identity<DidMountHandler<DayLaneMountData>>,
  dayLaneWillUnmount: identity as Identity<WillUnmountHandler<DayLaneMountData>>,

  initialView: String,
  aspectRatio: Number,
  weekends: Boolean,

  weekNumberCalculation: identity as Identity<WeekNumberCalculation>,
  weekNumbers: Boolean,
  weekNumberClass: identity as Identity<ClassNamesGenerator<WeekNumberDisplayData>>,
  weekNumberInnerClass: identity as Identity<ClassNamesInput>, // TODO: give the data?
  weekNumberContent: identity as Identity<CustomContentGenerator<WeekNumberDisplayData>>,
  weekNumberDidMount: identity as Identity<DidMountHandler<WeekNumberMountData>>,
  weekNumberWillUnmount: identity as Identity<WillUnmountHandler<WeekNumberMountData>>,

  editable: Boolean,

  viewClass: identity as Identity<ClassNamesGenerator<ViewData>>,
  viewDidMount: identity as Identity<DidMountHandler<ViewMountData>>,
  viewWillUnmount: identity as Identity<WillUnmountHandler<ViewMountData>>,

  nowIndicator: Boolean,

  nowIndicatorLabelClass: identity as Identity<ClassNamesGenerator<NowIndicatorLabelData>>,
  nowIndicatorLabelContent: identity as Identity<CustomContentGenerator<NowIndicatorLabelData>>,
  nowIndicatorLabelDidMount: identity as Identity<DidMountHandler<NowIndicatorLabelMountData>>,
  nowIndicatorLabelWillUnmount: identity as Identity<WillUnmountHandler<NowIndicatorLabelMountData>>,

  nowIndicatorLineClass: identity as Identity<ClassNamesGenerator<NowIndicatorLineData>>,
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

  eventClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  eventColorClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  eventInnerClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  eventTimeClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  eventTitleClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  eventBeforeClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  eventAfterClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  //
  listItemEventClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  listItemEventColorClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  listItemEventInnerClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  listItemEventTimeClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  listItemEventTitleClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  listItemEventBeforeClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  listItemEventAfterClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  //
  blockEventClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  blockEventColorClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  blockEventInnerClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  blockEventTimeClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  blockEventTitleClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  blockEventBeforeClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  blockEventAfterClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  //
  rowEventClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  rowEventColorClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  rowEventInnerClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  rowEventTimeClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  rowEventTitleClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  rowEventBeforeClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  rowEventAfterClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  //
  columnEventClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  columnEventColorClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  columnEventInnerClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  columnEventTimeClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  columnEventTitleClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  columnEventBeforeClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  columnEventAfterClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  //
  backgroundEventClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  backgroundEventColorClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  backgroundEventInnerClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  backgroundEventTimeClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  backgroundEventTitleClass: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  backgroundEventBeforeClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,
  backgroundEventAfterClass: identity as Identity<ClassNamesGenerator<EventDisplayData>>,

  selectConstraint: identity as Identity<ConstraintInput>,
  selectOverlap: identity as Identity<boolean | OverlapFunc>,
  selectAllow: identity as Identity<AllowFunc>,

  droppable: Boolean,
  unselectCancel: String,

  slotLabelFormat: identity as Identity<FormatterInput | FormatterInput[]>,

  slotLaneClass: identity as Identity<ClassNamesGenerator<SlotLaneData>>,
  slotLaneInnerClass: identity as Identity<ClassNamesInput>, // no args!
  slotLaneContent: identity as Identity<CustomContentGenerator<SlotLaneData>>,
  slotLaneDidMount: identity as Identity<DidMountHandler<SlotLaneMountData>>,
  slotLaneWillUnmount: identity as Identity<WillUnmountHandler<SlotLaneMountData>>,

  slotLabelClass: identity as Identity<ClassNamesGenerator<SlotLabelData>>,
  slotLabelInnerClass: identity as Identity<ClassNamesGenerator<SlotLabelData>>,
  slotLabelContent: identity as Identity<CustomContentGenerator<SlotLabelData>>,
  slotLabelDidMount: identity as Identity<DidMountHandler<SlotLabelMountData>>,
  slotLabelWillUnmount: identity as Identity<WillUnmountHandler<SlotLabelMountData>>,

  slotLabelRowClass: identity as Identity<ClassNamesInput>,
  slotLabelDividerClass: identity as Identity<ClassNamesInput>,

  dayMaxEvents: identity as Identity<boolean | number>,
  dayMaxEventRows: identity as Identity<boolean | number>,
  dayMinWidth: Number,
  slotLabelInterval: createDuration,

  allDayText: String,
  allDayHeaderClass: identity as Identity<ClassNamesGenerator<AllDayHeaderData>>,
  allDayHeaderInnerClass: identity as Identity<ClassNamesGenerator<AllDayHeaderData>>,
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
  moreLinkClass: identity as Identity<ClassNamesGenerator<MoreLinkData>>,
  moreLinkInnerClass: identity as Identity<ClassNamesGenerator<MoreLinkData>>,
  //
  rowMoreLinkClass: identity as Identity<ClassNamesGenerator<MoreLinkData>>,
  rowMoreLinkInnerClass: identity as Identity<ClassNamesGenerator<MoreLinkData>>,
  //
  columnMoreLinkClass: identity as Identity<ClassNamesGenerator<MoreLinkData>>,
  columnMoreLinkInnerClass: identity as Identity<ClassNamesGenerator<MoreLinkData>>,

  navLinkClass: identity as Identity<ClassNamesInput>,

  monthStartFormat: createFormatter,
  dayCellFormat: createFormatter,

  // for connectors
  // (can't be part of plugin system b/c must be provided at runtime)
  handleCustomRendering: identity as Identity<CustomRenderingHandler<any>>,
  customRenderingMetaMap: identity as Identity<{ [optionName: string]: any }>,
  customRenderingReplaces: Boolean,

  // new
  colorScheme: identity as Identity<'auto' | 'light' | 'dark'>,
  classNames: identity as Identity<ClassNamesGenerator<{
    direction: 'ltr' | 'rtl'
    mediaType: 'screen' | 'print'
    colorScheme: 'light' | 'dark'
  }>>,
  dayPopoverClass: identity as Identity<ClassNamesGenerator<DayPopoverData>>,
  popoverClass: identity as Identity<ClassNamesInput>,
  popoverHeaderClass: identity as Identity<ClassNamesInput>,
  popoverTitleClass: identity as Identity<ClassNamesInput>,
  popoverCloseClass: identity as Identity<ClassNamesInput>,
  popoverCloseContent: identity as Identity<CustomContentGenerator<{}>>,
  popoverBodyClass: identity as Identity<ClassNamesInput>,
  dayCompactWidth: Number,

  borderless: Boolean,
  borderlessX: Boolean,
  borderlessTop: Boolean,
  borderlessBottom: Boolean,

  fillerClass: identity as Identity<ClassNamesInput>,

  toolbarClass: identity as Identity<ClassNamesGenerator<ToolbarData>>,
  toolbarSectionClass: identity as Identity<ClassNamesGenerator<ToolbarSectionData>>,
  toolbarTitleClass: identity as Identity<ClassNamesInput>,

  viewHeaderClass: identity as Identity<ClassNamesGenerator<ViewHeaderData>>,
  viewBodyClass: identity as Identity<ClassNamesGenerator<ViewBodyData>>,

  nonBusinessClass: identity as Identity<ClassNamesInput>,
  highlightClass: identity as Identity<ClassNamesInput>,
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
  headerToolbar: {
    start: 'title',
    center: '',
    end: 'today prev,next',
  },
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
  dayCompactWidth: 0,
  eventOverlap: true,
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
  classNames: identity as Identity<ClassNamesGenerator<SpecificViewData>>,
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
