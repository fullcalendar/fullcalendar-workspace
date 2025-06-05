import { DateProfileGeneratorClass } from './DateProfileGenerator.js'
import { CalendarApi } from './api/CalendarApi.js'
import { EventApi } from './api/EventApi.js'
import {
  AllDayContentArg, AllDayMountArg,
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
  DateSelectArg,
  DatesSetArg,
  DateUnselectArg,
  DayLaneContentArg,
  DayLaneMountArg,
  DayPopoverContentArg,
  DidMountHandler,
  EventAddArg, EventChangeArg,
  EventClickArg,
  EventContentArg,
  EventHoveringArg,
  EventInput, EventInputTransformer,
  EventMountArg,
  EventRemoveArg,
  EventSourceInput,
  FormatterInput,
  LocaleInput,
  LocaleSingularArg,
  MoreLinkAction,
  MoreLinkContentArg,
  MoreLinkMountArg,
  NowIndicatorLabelContentArg,
  NowIndicatorLabelMountArg,
  NowIndicatorLineContentArg,
  NowIndicatorLineMountArg,
  OverlapFunc,
  PluginDef,
  SlotLabelContentArg, SlotLabelMountArg,
  SlotLaneContentArg, SlotLaneMountArg,
  SpecificViewContentArg, SpecificViewMountArg,
  ToolbarInput,
  ViewComponentType,
  ViewContentArg,
  ViewMountArg,
  WeekNumberCalculation,
  WeekNumberContentArg, WeekNumberMountArg,
  WillUnmountHandler,
  ButtonContentArg,
  ToolbarElementInput,
  ToolbarSectionArg,
  ToolbarArg,
  ButtonDisplay,
} from './api/structs.js'
import { ViewBodyContentArg, ViewHeaderContentArg } from './common/ViewSubsections.js'
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
  buttonGroupClassNames: identity as Identity<ClassNamesInput>,
  buttonClassNames: identity as Identity<ClassNamesGenerator<ButtonContentArg>>,

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
  dayLaneInnerClassNames: identity as Identity<ClassNamesGenerator<DayLaneContentArg>>,
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
  nowIndicatorLineDidMount: identity as Identity<DidMountHandler<NowIndicatorLineMountArg>>,
  nowIndicatorLineWillUnmount: identity as Identity<WillUnmountHandler<NowIndicatorLineMountArg>>,

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
  eventDidMount: identity as Identity<DidMountHandler<EventMountArg>>,
  eventWillUnmount: identity as Identity<WillUnmountHandler<EventMountArg>>,
  eventContent: identity as Identity<CustomContentGenerator<EventContentArg>>,

  eventClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  eventColorClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  eventInnerClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  eventTimeClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  eventTitleClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  eventBeforeClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  eventAfterClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  //
  listItemEventClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  listItemEventColorClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  listItemEventInnerClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  listItemEventTimeClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  listItemEventTitleClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  listItemEventBeforeClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  listItemEventAfterClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  //
  blockEventClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  blockEventColorClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  blockEventInnerClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  blockEventTimeClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  blockEventTitleClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  blockEventBeforeClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  blockEventAfterClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  //
  rowEventClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  rowEventColorClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  rowEventInnerClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  rowEventTimeClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  rowEventTitleClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  rowEventBeforeClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  rowEventAfterClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  //
  columnEventClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  columnEventColorClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  columnEventInnerClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  columnEventTimeClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  columnEventTitleClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  columnEventBeforeClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  columnEventAfterClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  //
  backgroundEventClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  backgroundEventColorClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  backgroundEventInnerClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  backgroundEventTimeClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  backgroundEventTitleClassNames: identity as Identity<ClassNamesGenerator<{ event: EventApi, isCompact: boolean }>>,
  backgroundEventBeforeClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,
  backgroundEventAfterClassNames: identity as Identity<ClassNamesGenerator<EventContentArg>>,

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
  moreLinkClassNames: identity as Identity<ClassNamesGenerator<MoreLinkContentArg>>,
  moreLinkInnerClassNames: identity as Identity<ClassNamesInput>, // TODO: accept arg
  moreLinkContent: identity as Identity<CustomContentGenerator<MoreLinkContentArg>>,
  moreLinkDidMount: identity as Identity<DidMountHandler<MoreLinkMountArg>>,
  moreLinkWillUnmount: identity as Identity<WillUnmountHandler<MoreLinkMountArg>>,

  navLinkClassNames: identity as Identity<ClassNamesInput>,

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
  popoverTitleClassNames: identity as Identity<ClassNamesInput>,
  popoverCloseClassNames: identity as Identity<ClassNamesInput>,
  popoverCloseContent: identity as Identity<CustomContentGenerator<{}>>,
  popoverBodyClassNames: identity as Identity<ClassNamesInput>,
  dayCompactWidth: Number,

  borderless: Boolean,
  borderlessX: Boolean,
  borderlessTop: Boolean,
  borderlessBottom: Boolean,

  fillerClassNames: identity as Identity<ClassNamesInput>,
  fillerXClassNames: identity as Identity<ClassNamesInput>,
  fillerYClassNames: identity as Identity<ClassNamesInput>,

  toolbarClassNames: identity as Identity<ClassNamesGenerator<ToolbarArg>>,
  toolbarSectionClassNames: identity as Identity<ClassNamesGenerator<ToolbarSectionArg>>,
  toolbarTitleClassNames: identity as Identity<ClassNamesInput>,

  viewHeaderClassNames: identity as Identity<ClassNamesGenerator<ViewHeaderContentArg>>,
  viewBodyClassNames: identity as Identity<ClassNamesGenerator<ViewBodyContentArg>>,

  nonBusinessClassNames: identity as Identity<ClassNamesInput>,
  highlightClassNames: identity as Identity<ClassNamesInput>,
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
  classNames: identity as Identity<ClassNamesGenerator<SpecificViewContentArg>>,
  content: identity as Identity<CustomContentGenerator<SpecificViewContentArg>>,
  didMount: identity as Identity<DidMountHandler<SpecificViewMountArg>>,
  willUnmount: identity as Identity<WillUnmountHandler<SpecificViewMountArg>>,
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
