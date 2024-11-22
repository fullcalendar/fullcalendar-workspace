import { ClassNamesGenerator, CustomContentGenerator, DayHeaderContentArg, DidMountHandler, WillUnmountHandler } from '@fullcalendar/core'
import { addDays, buildNavLinkAttrs, createFormatter, DateFormatter, DateMarker, DateMeta, DateProfile, DateRange, formatDayString, getDateMeta, getDayClassName, ViewContext } from '@fullcalendar/core/internal'

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
  renderConfig: CellRenderConfig<RenderProps>
  dataConfigs: CellDataConfig<RenderProps>[]
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

export function buildDateDataConfigs(
  dates: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
  colSpan = 1,
  keyPrefix = '',
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
        }
        const isNavLink = options.navLinks && !dateMeta.isDisabled

        return {
          key: keyPrefix + date.toUTCString(),
          renderProps,
          attrs: { 'data-date': !dateMeta.isDisabled ? formatDayString(date) : undefined },
          innerAttrs: isNavLink ? buildNavLinkAttrs(context, date) : {},
          colSpan,
          isNavLink,
          className: getDayClassName(dateMeta),
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
          date,
          view: viewApi,
          text,
        }

        return {
          key: keyPrefix + String(dow),
          renderProps,
          innerAttrs: { 'aria-label': dateEnv.format(normDate, WEEKDAY_FORMAT) },
          colSpan,
          className: getDayClassName(dayMeta),
        }
      })
}
