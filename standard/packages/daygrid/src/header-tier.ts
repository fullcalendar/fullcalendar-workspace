import { ClassNamesGenerator, CustomContentGenerator, DayHeaderContentArg, DidMountHandler, WillUnmountHandler } from '@fullcalendar/core'
import { addDays, buildDateStr, buildNavLinkAttrs, createFormatter, DateFormatter, DateMarker, DateMeta, DateProfile, DateRange, formatDayString, getDateMeta, getDayClassName, joinClassNames, ViewContext } from '@fullcalendar/core/internal'

export interface CellRenderConfig<RenderProps> {
  generatorName: string
  customGenerator: CustomContentGenerator<RenderProps>
  classNameGenerator: ClassNamesGenerator<RenderProps>
  didMount: DidMountHandler<RenderProps & { el: HTMLElement }>
  willUnmount: WillUnmountHandler<RenderProps & { el: HTMLElement }>
}

export interface CellDataConfig<RenderProps> {
  key: string
  renderProps: RenderProps
  className?: string
  attrs?: any // TODO
  innerAttrs?: any // TODO
  colSpan?: number // TODO: make required? easier for internal users
  isNavLink?: boolean
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

const WEEKDAY_FORMAT = createFormatter({ weekday: 'long' })
const firstSunday = new Date(259200000)

export function buildDateRowConfigs(
  ...args: Parameters<typeof buildDateRowConfig>
): RowConfig<DayHeaderContentArg>[] {
  return [buildDateRowConfig(...args)]
}

/*
Should this receive resource data attributes?
Or ResourceApi object itself?
*/
export function buildDateRowConfig(
  dates: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
  colSpan?: number,
): RowConfig<DayHeaderContentArg> {
  return {
    isDateRow: true,
    renderConfig: buildDateRenderConfig(context),
    dataConfigs: buildDateDataConfigs(
      dates,
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
      colSpan,
    )
  }
}

/*
For header cells: how to connect w/ custom rendering
Applies to all cells in a row
*/
export function buildDateRenderConfig(context: ViewContext): CellRenderConfig<DayHeaderContentArg> {
  const { options } = context

  return {
    generatorName: 'dayHeaderContent',
    customGenerator: options.dayHeaderContent,
    classNameGenerator: options.dayHeaderClassNames,
    didMount: options.dayHeaderDidMount,
    willUnmount: options.dayHeaderWillUnmount,
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
  dates: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
  colSpan = 1,
  keyPrefix = '',
  extraRenderProps: any = {}, // TODO
  extraAttrs: any = {}, // TODO
  className = '',
): CellDataConfig<DayHeaderContentArg>[] {
  const { dateEnv, viewApi, options } = context

  return datesRepDistinctDays
    ? dates.map((date) => { // Date
        const dateMeta = getDateMeta(date, todayRange, null, dateProfile)
        const text = dateEnv.format(date, dayHeaderFormat)
        const renderProps: DayHeaderContentArg = {
          ...dateMeta,
          date: dateEnv.toDate(date),
          view: viewApi,
          text,
          ...extraRenderProps,
        }
        const isNavLink = options.navLinks && !dateMeta.isDisabled &&
          dates.length > 1 // don't show navlink to day if only one day
        const fullDateStr = buildDateStr(context, date)

        // for DayGridHeaderCell
        return {
          key: keyPrefix + date.toUTCString(),
          renderProps,
          attrs: {
            'aria-label': fullDateStr,
            ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}), // TODO: assign undefined for nonexistent
            'data-date': formatDayString(date),
            ...extraAttrs,
          },
          // for navlink
          innerAttrs: isNavLink
            ? buildNavLinkAttrs(context, date, undefined, fullDateStr)
            : { 'aria-hidden': true }, // label already on cell
          colSpan,
          isNavLink,
          className: joinClassNames(className, getDayClassName(dateMeta)),
        }
      })
    : dates.map((date) => { // DayOfWeek
        const dow = date.getUTCDay()
        const normDate = addDays(firstSunday, dow)
        const dayMeta: DateMeta = {
          dow,
          isDisabled: false,
          isFuture: false,
          isPast: false,
          isToday: false,
          isOther: false,
        }
        const text = dateEnv.format(normDate, dayHeaderFormat)
        const renderProps: DayHeaderContentArg = {
          ...dayMeta,
          date: dowDates[dow],
          view: viewApi,
          text,
          ...extraRenderProps,
        }
        const fullWeekDayStr = dateEnv.format(normDate, WEEKDAY_FORMAT)

        // for DayGridHeaderCell
        return {
          key: keyPrefix + String(dow),
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
          className: joinClassNames(className, getDayClassName(dayMeta)),
        }
      })
}
