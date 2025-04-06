import { ComponentChild, createElement } from '../preact.js'
import { DateMarker } from '../datelib/marker.js'
import { DateMeta, getDayClassName } from '../component-util/date-rendering.js'
import { DateFormatter } from '../datelib/DateFormatter.js'
import { formatDayString } from '../datelib/formatting-utils.js'
import { MountArg } from './render-hook.js'
import { ViewApi } from '../api/ViewApi.js'
import { BaseComponent } from '../vdom-util.js'
import { memoizeObjArg } from '../util/memoize.js'
import { Dictionary, ViewOptions } from '../options.js'
import { DateEnv } from '../datelib/env.js'
import { ContentContainer, InnerContainerFunc } from '../content-inject/ContentContainer.js'
import { ElProps, hasCustomRenderingHandler } from '../content-inject/ContentInjector.js'
import { joinClassNames } from '../util/html.js'

export interface DayLaneContentArg extends DateMeta {
  date: DateMarker // localized
  isMajor: boolean
  view: ViewApi
  [extraProp: string]: any // so can include a resource
}

export type DayLaneMountArg = MountArg<DayLaneContentArg>

export interface DayLaneContainerProps extends Partial<ElProps> {
  date: DateMarker
  dateMeta: DateMeta
  isMajor: boolean
  isMonthStart?: boolean
  renderProps?: Dictionary // for EXTRA render props
  defaultGenerator?: (renderProps: DayLaneContentArg) => ComponentChild
  children?: InnerContainerFunc<DayLaneContentArg>
}

export class DayLaneContainer extends BaseComponent<DayLaneContainerProps> {
  refineRenderProps = memoizeObjArg(refineRenderProps)

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({
      date: props.date,
      isMajor: props.isMajor,
      dateMeta: props.dateMeta,
      isMonthStart: props.isMonthStart || false,
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
          'data-date': formatDayString(props.date),
          ...(renderProps.isToday ? { 'aria-current': 'date' } : {}),
        }}
        renderProps={renderProps}
        generatorName="dayLaneContent"
        customGenerator={options.dayLaneContent}
        defaultGenerator={props.defaultGenerator}
        classNameGenerator={options.dayLaneClassNames}
        didMount={options.dayLaneDidMount}
        willUnmount={options.dayLaneWillUnmount}
      />
    )
  }
}

export function hasCustomDayLaneContent(options: ViewOptions): boolean {
  return Boolean(options.dayLaneContent || hasCustomRenderingHandler('dayLaneContent', options))
}

// Render Props

interface DayCellRenderPropsInput {
  date: DateMarker // generic
  isMajor: boolean
  dateMeta: DateMeta
  dateEnv: DateEnv
  viewApi: ViewApi
  monthStartFormat: DateFormatter
  isMonthStart: boolean // defaults to false
  renderProps?: Dictionary // so can include a resource
}

function refineRenderProps(raw: DayCellRenderPropsInput): DayLaneContentArg {
  let { date, dateEnv, isMonthStart } = raw

  return {
    date: dateEnv.toDate(date),
    isMajor: raw.isMajor,
    view: raw.viewApi,
    ...raw.dateMeta,
    isMonthStart,
    ...raw.renderProps,
  }
}
