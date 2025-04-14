import { createDuration, Duration } from './datelib/duration.js'
import { mergeProps, isPropsEqual } from './util/object.js'
import { isArraysEqual } from './util/array.js'
import { createFormatter } from './datelib/formatting.js'
import { parseFieldSpecs } from './util/misc.js'
import { DateProfileGeneratorClass } from './DateProfileGenerator.js'
import { CalendarApi } from './api/CalendarApi.js'
import { EventApi } from './api/EventApi.js'
import {
  CssDimValue,
  DateInput,
  DateRangeInput,
  BusinessHoursInput,
  EventSourceInput,
  LocaleSingularArg, LocaleInput,
  EventInput, EventInputTransformer,
  OverlapFunc, ConstraintInput, AllowFunc,
  PluginDef,
  ViewComponentType,
  SpecificViewContentArg, SpecificViewMountArg,
  ClassNamesGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler,
  WeekNumberContentArg, WeekNumberMountArg,
  SlotLaneContentArg, SlotLaneMountArg,
  SlotLabelContentArg, SlotLabelMountArg,
  AllDayContentArg, AllDayMountArg,
  ViewMountArg,
  EventClickArg,
  EventHoveringArg,
  DateSelectArg, DateUnselectArg,
  WeekNumberCalculation,
  FormatterInput,
  ToolbarInput, CustomButtonInput, ButtonIconsInput, ButtonTextCompoundInput,
  EventContentArg, EventMountArg,
  DatesSetArg,
  EventAddArg, EventChangeArg, EventRemoveArg,
  MoreLinkContentArg,
  MoreLinkMountArg,
  MoreLinkAction,
  ButtonHintCompoundInput,
  CustomRenderingHandler,
  DayLaneContentArg,
  DayLaneMountArg,
  NowIndicatorLabelContentArg,
  NowIndicatorLabelMountArg,
  NowIndicatorLineContentArg,
  NowIndicatorLineMountArg,
  ViewContentArg,
  DayPopoverContentArg,
} from './api/structs.js'
import { ClassNamesInput } from './util/html.js'
import { ViewBodyContentArg, ViewHeaderContentArg } from './common/ViewSubsections.js'

// base options
// ------------

export const BASE_OPTION_REFINERS = {
  navLinkDayClick: identity as Identity<string | ((this: CalendarApi, date: Date, jsEvent: UIEvent) => void)>,
  navLinkWeekClick: identity as Identity<string | ((this: CalendarApi, weekStart: Date, jsEvent: UIEvent) => void)>,
  duration: createDuration,
  bootstrapFontAwesome: identity as Identity<ButtonIconsInput | false>, // TODO: move to bootstrap plugin
  buttonIcons: identity as Identity<ButtonIconsInput | false>,
  customButtons: identity as Identity<{ [name: string]: CustomButtonInput }>,
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
  dayLaneClassNames: identity as Identity<ClassNamesGenerator<DayLaneContentArg>>,
  dayLaneInnerClassNames: identity as Identity<ClassNamesInput>, // does not accept arg!
  dayLaneContent: identity as Identity<CustomContentGenerator<DayLaneContentArg>>,
  dayLaneDidMount: identity as Identity<DidMountHandler<DayLaneMountArg>>,
  dayLaneWillUnmount: identity as Identity<WillUnmountHandler<DayLaneMountArg>>,

  initialView: String,
  aspectRatio: Number,
  weekends: Boolean,

  weekNumberCalculation: identity as Identity<WeekNumberCalculation>,
  weekNumbers: Boolean,
  weekNumberClassNames: identity as Identity<ClassNamesGenerator<WeekNumberContentArg>>,
  weekNumberInnerClassNames: identity as Identity<ClassNamesInput>, // TODO: give the arg?
  weekNumberContent: identity as Identity<CustomContentGenerator<WeekNumberContentArg>>,
  weekNumberDidMount: identity as Identity<DidMountHandler<WeekNumberMountArg>>,
  weekNumberWillUnmount: identity as Identity<WillUnmountHandler<WeekNumberMountArg>>,

  editable: Boolean,

  viewClassNames: identity as Identity<ClassNamesGenerator<ViewContentArg>>,
  viewDidMount: identity as Identity<DidMountHandler<ViewMountArg>>,
  viewWillUnmount: identity as Identity<WillUnmountHandler<ViewMountArg>>,

  nowIndicator: Boolean,

  nowIndicatorLabelClassNames: identity as Identity<ClassNamesGenerator<NowIndicatorLabelContentArg>>,
  nowIndicatorLabelContent: identity as Identity<CustomContentGenerator<NowIndicatorLabelContentArg>>,
  nowIndicatorLabelDidMount: identity as Identity<DidMountHandler<NowIndicatorLabelMountArg>>,
  nowIndicatorLabelWillUnmount: identity as Identity<WillUnmountHandler<NowIndicatorLabelMountArg>>,

  nowIndicatorLineClassNames: identity as Identity<ClassNamesGenerator<NowIndicatorLineContentArg>>,
  nowIndicatorLineContent: identity as Identity<CustomContentGenerator<NowIndicatorLineContentArg>>,
  nowIndicatorLinelDidMount: identity as Identity<DidMountHandler<NowIndicatorLineMountArg>>,
  nowIndicatorLineWillUnmount: identity as Identity<WillUnmountHandler<NowIndicatorLineMountArg>>,

  showNonCurrentDates: Boolean,
  lazyFetching: Boolean,
  startParam: String,
  endParam: String,
  timeZoneParam: String,
  timeZone: String,
  locales: identity as Identity<LocaleInput[]>,
  locale: identity as Identity<LocaleSingularArg>,
  themeSystem: String as Identity<'standard' | string>,
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
  weekText: String, // the short version
  weekTextLong: String, // falls back to weekText
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
  eventBackgroundColor: String,
  eventBorderColor: String,
  eventTextColor: String,
  eventColor: String,
  eventClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  eventContent: identity as Identity<CustomContentGenerator<EventContentArg>>,
  eventDidMount: identity as Identity<DidMountHandler<EventMountArg>>,
  eventWillUnmount: identity as Identity<WillUnmountHandler<EventMountArg>>,

  // TODO: maybe have these accept args
  eventColorClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  eventInnerClassNames: identity as Identity<ClassNamesInput>,
  eventTimeClassNames: identity as Identity<ClassNamesInput>,
  eventTitleOuterClassNames: identity as Identity<ClassNamesInput>, // TODO: eventually remove!
  eventTitleClassNames: identity as Identity<ClassNamesInput>,
  eventResizerClassNames: identity as Identity<ClassNamesInput>,
  eventResizerStartClassNames: identity as Identity<ClassNamesInput>,
  eventResizerEndClassNames: identity as Identity<ClassNamesInput>,

  selectConstraint: identity as Identity<ConstraintInput>,
  selectOverlap: identity as Identity<boolean | OverlapFunc>,
  selectAllow: identity as Identity<AllowFunc>,

  droppable: Boolean,
  unselectCancel: String,

  slotLabelFormat: identity as Identity<FormatterInput | FormatterInput[]>,

  slotLaneClassNames: identity as Identity<ClassNamesGenerator<SlotLaneContentArg>>,
  slotLaneInnerClassNames: identity as Identity<ClassNamesInput>, // no args!
  slotLaneContent: identity as Identity<CustomContentGenerator<SlotLaneContentArg>>,
  slotLaneDidMount: identity as Identity<DidMountHandler<SlotLaneMountArg>>,
  slotLaneWillUnmount: identity as Identity<WillUnmountHandler<SlotLaneMountArg>>,

  slotLabelClassNames: identity as Identity<ClassNamesGenerator<SlotLabelContentArg>>,
  slotLabelInnerClassNames: identity as Identity<ClassNamesGenerator<SlotLabelContentArg>>,
  slotLabelContent: identity as Identity<CustomContentGenerator<SlotLabelContentArg>>,
  slotLabelDidMount: identity as Identity<DidMountHandler<SlotLabelMountArg>>,
  slotLabelWillUnmount: identity as Identity<WillUnmountHandler<SlotLabelMountArg>>,

  slotLabelRowClassNames: identity as Identity<ClassNamesInput>,
  slotLabelDividerClassNames: identity as Identity<ClassNamesInput>,

  dayMaxEvents: identity as Identity<boolean | number>,
  dayMaxEventRows: identity as Identity<boolean | number>,
  dayMinWidth: Number,
  slotLabelInterval: createDuration,

  allDayText: String,
  allDayHeaderClassNames: identity as Identity<ClassNamesGenerator<AllDayContentArg>>,
  allDayHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<AllDayContentArg>>,
  allDayHeaderContent: identity as Identity<CustomContentGenerator<AllDayContentArg>>,
  allDayHeaderDidMount: identity as Identity<DidMountHandler<AllDayMountArg>>,
  allDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<AllDayMountArg>>,

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
  eventShortHeight: Number,
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

  viewHint: identity as Identity<string | ((...args: any[]) => string)>,
  viewChangeHint: String,
  navLinkHint: identity as Identity<string | ((...args: any[]) => string)>,
  closeHint: String,
  eventsHint: String,

  headingLevel: Number,

  moreLinkClick: identity as Identity<MoreLinkAction>,
  moreLinkClassNames: identity as Identity<ClassNamesGenerator<MoreLinkContentArg>>,
  moreLinkContent: identity as Identity<CustomContentGenerator<MoreLinkContentArg>>,
  moreLinkDidMount: identity as Identity<DidMountHandler<MoreLinkMountArg>>,
  moreLinkWillUnmount: identity as Identity<WillUnmountHandler<MoreLinkMountArg>>,

  monthStartFormat: createFormatter,
  dayCellFormat: createFormatter,

  // for connectors
  // (can't be part of plugin system b/c must be provided at runtime)
  handleCustomRendering: identity as Identity<CustomRenderingHandler<any>>,
  customRenderingMetaMap: identity as Identity<{ [optionName: string]: any }>,
  customRenderingReplaces: Boolean,

  // new
  classNames: identity as Identity<ClassNamesInput>,
  directionClassNames: identity as Identity<ClassNamesGenerator<string>>,
  mediaTypeClassNames: identity as Identity<ClassNamesGenerator<string>>,
  colorScheme: identity as Identity<'auto' | 'light' | 'dark'>,
  colorSchemeClassNames: identity as Identity<ClassNamesGenerator<'light' | 'dark'>>,
  dayPopoverClassNames: identity as Identity<ClassNamesGenerator<DayPopoverContentArg>>,
  popoverClassNames: identity as Identity<ClassNamesInput>,
  popoverHeaderClassNames: identity as Identity<ClassNamesInput>,
  popoverBodyClassNames: identity as Identity<ClassNamesInput>,
  dayNarrowWidth: Number,
  dayNarrowClassNames: identity as Identity<ClassNamesInput>,
  dayNotNarrowClassNames: identity as Identity<ClassNamesInput>,

  outerBorder: Boolean,
  outerBorderX: Boolean,
  outerBorderTop: Boolean,
  outerBorderBottom: Boolean,

  fillerClassNames: identity as Identity<ClassNamesInput>,
  fillerXClassNames: identity as Identity<ClassNamesInput>,
  fillerYClassNames: identity as Identity<ClassNamesInput>,

  toolbarClassNames: identity as Identity<ClassNamesInput>,
  headerToolbarClassNames: identity as Identity<ClassNamesInput>,
  footerToolbarClassNames: identity as Identity<ClassNamesInput>,

  viewHeaderClassNames: identity as Identity<ClassNamesGenerator<ViewHeaderContentArg>>,
  viewBodyClassNames: identity as Identity<ClassNamesGenerator<ViewBodyContentArg>>,
}

type BuiltInBaseOptionRefiners = typeof BASE_OPTION_REFINERS

export interface BaseOptionRefiners extends BuiltInBaseOptionRefiners {
  // for ambient-extending
}

export type BaseOptions = RawOptionsFromRefiners< // as RawOptions
  Required<BaseOptionRefiners> // Required is a hack for "Index signature is missing"
>

// do NOT give a type here. need `typeof BASE_OPTION_DEFAULTS` to give real results.
// raw values.
export const BASE_OPTION_DEFAULTS = {
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
  themeSystem: 'standard',
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
  eventShortHeight: 30,
  monthStartFormat: { month: 'long', day: 'numeric' },
  dayCellFormat: { day: 'numeric' },
  headingLevel: 2, // like H2
  outerBorder: true,
  dayNarrowWidth: 0,
}

export type BaseOptionsRefined = DefaultedRefinedOptions<
  RefinedOptionsFromRefiners<Required<BaseOptionRefiners>>, // Required is a hack for "Index signature is missing"
  keyof typeof BASE_OPTION_DEFAULTS
>

// calendar listeners
// ------------------

export const CALENDAR_LISTENER_REFINERS = {
  datesSet: identity as Identity<(arg: DatesSetArg) => void>,
  eventsSet: identity as Identity<(events: EventApi[]) => void>,
  eventAdd: identity as Identity<(arg: EventAddArg) => void>,
  eventChange: identity as Identity<(arg: EventChangeArg) => void>,
  eventRemove: identity as Identity<(arg: EventRemoveArg) => void>,
  eventClick: identity as Identity<(arg: EventClickArg) => void>, // TODO: resource for scheduler????
  eventMouseEnter: identity as Identity<(arg: EventHoveringArg) => void>,
  eventMouseLeave: identity as Identity<(arg: EventHoveringArg) => void>,
  select: identity as Identity<(arg: DateSelectArg) => void>, // resource for scheduler????
  unselect: identity as Identity<(arg: DateUnselectArg) => void>,
  loading: identity as Identity<(isLoading: boolean) => void>,

  // internal
  _unmount: identity as Identity<() => void>,
  _beforeprint: identity as Identity<() => void>,
  _afterprint: identity as Identity<() => void>,
  _noEventDrop: identity as Identity<() => void>,
  _noEventResize: identity as Identity<() => void>,
  _timeScrollRequest: identity as Identity<(time: Duration) => void>,
}

type BuiltInCalendarListenerRefiners = typeof CALENDAR_LISTENER_REFINERS

export interface CalendarListenerRefiners extends BuiltInCalendarListenerRefiners {
  // for ambient extending
}

type CalendarListenersLoose = RefinedOptionsFromRefiners<Required<CalendarListenerRefiners>> // Required hack
export type CalendarListeners = Required<CalendarListenersLoose> // much more convenient for Emitters and whatnot

// calendar-specific options
// -------------------------

export const CALENDAR_OPTION_REFINERS = { // does not include base nor calendar listeners
  buttonText: identity as Identity<ButtonTextCompoundInput>,
  buttonHints: identity as Identity<ButtonHintCompoundInput>,
  views: identity as Identity<{ [viewId: string]: ViewOptions }>,
  plugins: identity as Identity<PluginDef[]>,
  initialEvents: identity as Identity<EventSourceInput>,
  events: identity as Identity<EventSourceInput>,
  eventSources: identity as Identity<EventSourceInput[]>,
}

type BuiltInCalendarOptionRefiners = typeof CALENDAR_OPTION_REFINERS

export interface CalendarOptionRefiners extends BuiltInCalendarOptionRefiners {
  // for ambient-extending
}

export type CalendarOptions =
  BaseOptions &
  CalendarListenersLoose &
  RawOptionsFromRefiners<Required<CalendarOptionRefiners>> // Required hack https://github.com/microsoft/TypeScript/issues/15300

export type CalendarOptionsRefined =
  BaseOptionsRefined &
  CalendarListenersLoose &
  RefinedOptionsFromRefiners<Required<CalendarOptionRefiners>> // Required hack

export const COMPLEX_OPTION_COMPARATORS: {
  [optionName in keyof CalendarOptions]: (a: CalendarOptions[optionName], b: CalendarOptions[optionName]) => boolean
} = {
  headerToolbar: isMaybeObjectsEqual,
  footerToolbar: isMaybeObjectsEqual,
  buttonText: isMaybeObjectsEqual,
  buttonHints: isMaybeObjectsEqual,
  buttonIcons: isMaybeObjectsEqual,
  dateIncrement: isMaybeObjectsEqual,
  plugins: isMaybeArraysEqual,
  events: isMaybeArraysEqual,
  eventSources: isMaybeArraysEqual,
  ['resources' as any]: isMaybeArraysEqual,
}

export function isMaybeObjectsEqual(a, b) {
  if (typeof a === 'object' && typeof b === 'object' && a && b) { // both non-null objects
    return isPropsEqual(a, b)
  }
  return a === b
}

function isMaybeArraysEqual(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return isArraysEqual(a, b)
  }
  return a === b
}

// view-specific options
// ---------------------

export const VIEW_OPTION_REFINERS: {
  [name: string]: any
} = {
  type: String,
  component: identity as Identity<ViewComponentType>,
  buttonText: String,
  buttonTextKey: String, // internal only
  dateProfileGeneratorClass: identity as Identity<DateProfileGeneratorClass>,
  usesMinMaxTime: Boolean, // internal only
  classNames: identity as Identity<ClassNamesGenerator<SpecificViewContentArg>>,
  content: identity as Identity<CustomContentGenerator<SpecificViewContentArg>>,
  didMount: identity as Identity<DidMountHandler<SpecificViewMountArg>>,
  willUnmount: identity as Identity<WillUnmountHandler<SpecificViewMountArg>>,
}

type BuiltInViewOptionRefiners = typeof VIEW_OPTION_REFINERS

export interface ViewOptionRefiners extends BuiltInViewOptionRefiners {
  // for ambient-extending
}

export type ViewOptions =
  BaseOptions &
  CalendarListenersLoose &
  RawOptionsFromRefiners<Required<ViewOptionRefiners>> // Required hack

export type ViewOptionsRefined =
  BaseOptionsRefined &
  CalendarListenersLoose &
  RefinedOptionsFromRefiners<Required<ViewOptionRefiners>> // Required hack

// util funcs
// ----------------------------------------------------------------------------------------------------

export function mergeRawOptions(optionSets: Dictionary[]) {
  return mergeProps(optionSets, COMPLEX_OPTION_COMPARATORS)
}

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

export type Dictionary = Record<string, any>

export type Identity<T = any> = (raw: T) => T

export function identity<T>(raw: T): T {
  return raw
}
