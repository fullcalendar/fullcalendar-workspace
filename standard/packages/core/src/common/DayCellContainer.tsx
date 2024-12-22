import { ComponentChild, createElement } from '../preact.js'
import { DateMarker } from '../datelib/marker.js'
import { DateRange } from '../datelib/date-range.js'
import { getDateMeta, DateMeta, getDayClassName } from '../component-util/date-rendering.js'
import { createFormatter } from '../datelib/formatting.js'
import { DateFormatter } from '../datelib/DateFormatter.js'
import { formatDayString } from '../datelib/formatting-utils.js'
import { MountArg } from './render-hook.js'
import { ViewApi } from '../api/ViewApi.js'
import { BaseComponent } from '../vdom-util.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { memoizeObjArg } from '../util/memoize.js'
import { Dictionary, ViewOptions } from '../options.js'
import { DateEnv } from '../datelib/env.js'
import { ContentContainer, InnerContainerFunc } from '../content-inject/ContentContainer.js'
import { ElProps, hasCustomRenderingHandler } from '../content-inject/ContentInjector.js'
import { joinClassNames } from '../util/html.js'

export interface DayCellContentArg extends DateMeta {
  date: DateMarker // localized
  view: ViewApi
  dayNumberText: string
  [extraProp: string]: any // so can include a resource
}

export type DayCellMountArg = MountArg<DayCellContentArg>

export interface DayCellContainerProps extends Partial<ElProps> {
  date: DateMarker
  dateProfile: DateProfile
  todayRange: DateRange
  isMonthStart?: boolean
  showDayNumber?: boolean // defaults to false
  renderProps?: Dictionary
  defaultGenerator?: (renderProps: DayCellContentArg) => ComponentChild
  children?: InnerContainerFunc<DayCellContentArg>
}

const DAY_NUM_FORMAT = createFormatter({ day: 'numeric' })

export class DayCellContainer extends BaseComponent<DayCellContainerProps> {
  refineRenderProps = memoizeObjArg(refineRenderProps)

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({
      date: props.date,
      dateProfile: props.dateProfile,
      todayRange: props.todayRange,
      isMonthStart: props.isMonthStart || false,
      showDayNumber: props.showDayNumber,
      renderProps: props.renderProps,
      viewApi: context.viewApi,
      dateEnv: context.dateEnv,
      monthStartFormat: options.monthStartFormat,
    })

    return (
      <ContentContainer
        {...props /* includes children */}
        className={joinClassNames(
          props.className,
          getDayClassName(renderProps),
        )}
        attrs={{
          ...props.attrs,
          ...(renderProps.isDisabled ? {} : { 'data-date': formatDayString(props.date) }),
          ...(renderProps.isToday ? { 'aria-current': 'date' } : {}),
        }}
        renderProps={renderProps}
        generatorName="dayCellContent"
        customGenerator={options.dayCellContent}
        defaultGenerator={props.defaultGenerator}
        classNameGenerator={
          // don't use custom classNames if disabled
          // TODO: make DRY with DayGridHeaderCell
          renderProps.isDisabled ? undefined : options.dayCellClassNames
        }
        didMount={options.dayCellDidMount}
        willUnmount={options.dayCellWillUnmount}
      />
    )
  }
}

export function hasCustomDayCellContent(options: ViewOptions): boolean {
  return Boolean(options.dayCellContent || hasCustomRenderingHandler('dayCellContent', options))
}

// Render Props

interface DayCellRenderPropsInput {
  date: DateMarker // generic
  dateProfile: DateProfile
  todayRange: DateRange
  dateEnv: DateEnv
  viewApi: ViewApi
  monthStartFormat: DateFormatter
  isMonthStart: boolean // defaults to false
  showDayNumber?: boolean // defaults to false
  renderProps?: Dictionary // so can include a resource
}

function refineRenderProps(raw: DayCellRenderPropsInput): DayCellContentArg {
  let { date, dateEnv, dateProfile, isMonthStart } = raw
  let dayMeta = getDateMeta(date, raw.todayRange, null, dateProfile)
  let dayNumberText = raw.showDayNumber ? (
    dateEnv.format(date, isMonthStart ? raw.monthStartFormat : DAY_NUM_FORMAT)
  ) : ''

  return {
    date: dateEnv.toDate(date),
    view: raw.viewApi,
    ...dayMeta,
    isMonthStart,
    dayNumberText,
    ...raw.renderProps,
  }
}
