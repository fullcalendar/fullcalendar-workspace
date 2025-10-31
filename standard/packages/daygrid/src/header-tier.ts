import { ClassNameGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler, DayHeaderData } from '@fullcalendar/core'
import { addDays, buildDateStr, buildNavLinkAttrs, computeMajorUnit, DateFormatter, DateMarker, DateMeta, DateProfile, DateRange, Dictionary, findDayNumberText, findWeekdayText, formatDayString, getDateMeta, isMajorUnit, ViewContext, WEEKDAY_ONLY_FORMAT } from '@fullcalendar/core/internal'

/*
Just for the HEADER
*/
export interface CellRenderConfig<RenderProps> {
  generatorName: string
  customGenerator: CustomContentGenerator<RenderProps>
  innerClassNameGenerator: ClassNameGenerator<RenderProps>
  classNameGenerator: ClassNameGenerator<RenderProps>
  didMount: DidMountHandler<RenderProps & { el: HTMLElement }>
  willUnmount: WillUnmountHandler<RenderProps & { el: HTMLElement }>
  align: 'start' | 'center' | 'end' | ((data: { level: number, inPopover: boolean, isNarrow: boolean }) => 'start' | 'center' | 'end'),
  sticky: boolean | number | string,
}

export interface CellDataConfig<RenderProps> {
  key: string
  dateMarker: DateMarker
  renderProps: RenderProps
  className?: string
  attrs?: any // TODO
  innerAttrs?: any // TODO
  colSpan?: number // TODO: make required? easier for internal users
  hasNavLink?: boolean
}

export interface RowConfig<RenderProps> {
  isDateRow: boolean
  renderConfig: CellRenderConfig<RenderProps>
  dataConfigs: CellDataConfig<RenderProps>[] // for the CELLs
}

// TODO: converge types with DayTableCell and DayCellContainer (the component) and refineRenderProps
// the generation of DayTableCell will be distinct (for the BODY cells)
// but can share some of the same types/utils

// Date Cells
// -------------------------------------------------------------------------------------------------

const firstSunday = new Date(259200000)

export function buildDateRowConfigs(
  dates: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
): RowConfig<DayHeaderData>[] {
  const rowConfig = buildDateRowConfig(
    dates,
    datesRepDistinctDays,
    dateProfile,
    todayRange,
    dayHeaderFormat,
    context,
  )
  const majorUnit = computeMajorUnit(dateProfile, context.dateEnv)

  // HACK mutate isMajor
  if (datesRepDistinctDays) {
    for (const dataConfig of rowConfig.dataConfigs) {
      if (isMajorUnit(dataConfig.dateMarker, majorUnit, context.dateEnv)) {
        dataConfig.renderProps.isMajor = true
      }
    }
  }

  return [rowConfig]
}

/*
Should this receive resource data attributes?
Or ResourceApi object itself?
*/
export function buildDateRowConfig(
  dateMarkers: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
  colSpan?: number,
  isMajorMod?: number,
): RowConfig<DayHeaderData> {
  return {
    isDateRow: true,
    renderConfig: buildDateRenderConfig(context),
    dataConfigs: buildDateDataConfigs(
      dateMarkers,
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
      colSpan,
      undefined,
      undefined,
      undefined,
      undefined,
      isMajorMod,
    )
  }
}

/*
For header cells: how to connect w/ custom rendering
Applies to all cells in a row
*/
export function buildDateRenderConfig(context: ViewContext): CellRenderConfig<DayHeaderData> {
  const { options } = context

  return {
    generatorName: 'dayHeaderContent',
    customGenerator: options.dayHeaderContent,
    classNameGenerator: options.dayHeaderClass,
    innerClassNameGenerator: options.dayHeaderInnerClass,
    didMount: options.dayHeaderDidMount,
    willUnmount: options.dayHeaderWillUnmount,
    align: options.dayHeaderAlign,
    sticky: options.dayHeaderSticky,
  }
}

const dowDates: Date[] = []

for (let dow = 0; dow < 7; dow++) {
  dowDates.push(addDays(new Date(259200000), dow)) // start with Sun, 04 Jan 1970 00:00:00 GMT)
}

/*
For header cells: data
*/
export function buildDateDataConfigs(
  dateMarkers: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
  colSpan = 1,
  keyPrefix = '',
  extraRenderProps: Dictionary = {}, // TODO
  extraAttrs: Dictionary = {}, // TODO
  className = '',
  isMajorMod?: number,
): CellDataConfig<DayHeaderData>[] {
  const { dateEnv, viewApi, options } = context

  return datesRepDistinctDays
    ? dateMarkers.map((dateMarker, i) => { // Date
        const dateMeta = getDateMeta(dateMarker, dateEnv, dateProfile, todayRange)
        const isMajor = isMajorMod != null && !(i % isMajorMod)
        const [text, textParts] = dateEnv.format(dateMarker, dayHeaderFormat)
        const hasNavLink = options.navLinks && !dateMeta.isDisabled &&
          dateMarkers.length > 1 // don't show navlink to day if only one day
        const renderProps: DayHeaderData = {
          ...dateMeta,
          ...extraRenderProps,
          text,
          textParts,
          get weekdayText() { return findWeekdayText(textParts) },
          get dayNumberText() { return findDayNumberText(textParts) },
          isMajor,
          isNarrow: false, // HACK. gets overridden
          isSticky: false, // HACK. gets overridden
          inPopover: false,
          level: 0, // HACK. gets overridden
          hasNavLink,
          view: viewApi,
        }
        const fullDateStr = buildDateStr(context, dateMarker)

        // for DayGridHeaderCell
        return {
          key: keyPrefix + dateMarker.toUTCString(),
          dateMarker,
          renderProps,
          attrs: {
            'aria-label': fullDateStr,
            ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}), // TODO: assign undefined for nonexistent
            'data-date': formatDayString(dateMarker),
            ...extraAttrs,
          },
          // for navlink
          innerAttrs: hasNavLink
            ? buildNavLinkAttrs(context, dateMarker, undefined, fullDateStr)
            : { 'aria-hidden': true }, // label already on cell
          colSpan,
          hasNavLink,
          className,
        }
      })
    : dateMarkers.map((dateMarker, i) => { // DayOfWeek
        const dow = dateMarker.getUTCDay()
        const normDate = addDays(firstSunday, dow)
        const dateMeta: DateMeta = {
          date: dateEnv.toDate(dateMarker),
          dow,
          isDisabled: false,
          isFuture: false,
          isPast: false,
          isToday: false,
          isOther: false,
        }
        const isMajor = isMajorMod != null && !(i % isMajorMod)
        const [text, textParts] = dateEnv.format(normDate, dayHeaderFormat)
        const renderProps: DayHeaderData = {
          ...dateMeta,
          date: dowDates[dow],
          isMajor,
          isNarrow: false, // HACK. gets overridden
          isSticky: false, // HACK. gets overridden
          inPopover: false,
          hasNavLink: false,
          level: 0, // HACK. gets overridden
          view: viewApi,
          text,
          textParts,
          get weekdayText() { return findWeekdayText(textParts) },
          get dayNumberText() { return findDayNumberText(textParts) },
          ...extraRenderProps,
        }
        const fullWeekDayStr = dateEnv.format(normDate, WEEKDAY_ONLY_FORMAT)[0]

        // for DayGridHeaderCell
        return {
          key: keyPrefix + String(dow),
          dateMarker,
          renderProps,
          attrs: {
            'aria-label': fullWeekDayStr,
            ...extraAttrs,
          },
          // NOT a navlink
          innerAttrs: {
            'aria-hidden': true, // label already on cell
          },
          colSpan,
          className,
        }
      })
}
