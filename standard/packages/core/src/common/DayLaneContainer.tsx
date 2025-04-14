import { ViewApi } from '../api/ViewApi.js'
import { DateMeta } from '../component-util/date-rendering.js'
import { ContentContainer, InnerContainerFunc } from '../content-inject/ContentContainer.js'
import { ElProps, hasCustomRenderingHandler } from '../content-inject/ContentInjector.js'
import { formatDayString } from '../datelib/formatting-utils.js'
import { DateMarker } from '../datelib/marker.js'
import { Dictionary, ViewOptions } from '../options.js'
import { ComponentChild, createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { MountArg } from './render-hook.js'

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
  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = {
      ...props.dateMeta,
      ...props.renderProps,
      isMajor: props.isMajor,
      isMonthStart: props.isMonthStart || false,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        {...props /* includes children */}
        className={props.className}
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
