import {
  DayHeaderContentArg,
} from '@fullcalendar/core'
import {
  DateRange,
  getDayClassNames,
  getDateMeta,
  DateMarker,
  DateFormatter,
  formatDayString,
  BaseComponent,
  buildNavLinkAttrs,
  DateProfile,
  Dictionary,
  ContentContainer,
} from '@fullcalendar/core/internal'
import { Ref, createElement } from '@fullcalendar/core/preact'
import { HEADER_CELL_CLASS_NAME, renderInner } from '../util.js'

export interface DateHeaderCellProps {
  dateProfile: DateProfile
  todayRange: DateRange
  date: DateMarker
  navLink: boolean
  dayHeaderFormat: DateFormatter
  isSticky?: boolean
  colSpan?: number

  // render props
  extraRenderProps?: Dictionary
  extraDataAttrs?: Dictionary
  extraClassNames?: string[]

  // dimensions
  colWidth?: number

  // ref
  innerElRef?: Ref<HTMLDivElement>
}

export class DateHeaderCell extends BaseComponent<DateHeaderCellProps> {
  render() {
    let { props, context } = this
    let { dateProfile, date, extraRenderProps, extraDataAttrs } = props
    let { dateEnv, options, theme, viewApi } = context

    let dayMeta = getDateMeta(date, props.todayRange, null, dateProfile)
    let text = dateEnv.format(date, props.dayHeaderFormat)
    let navLinkAttrs = (!dayMeta.isDisabled && props.navLink)
      ? buildNavLinkAttrs(context, date)
      : {}

    let renderProps: DayHeaderContentArg = {
      date: dateEnv.toDate(date),
      view: viewApi,
      ...extraRenderProps,
      text,
      ...dayMeta,
    }

    return (
      <ContentContainer
        elClasses={[
          HEADER_CELL_CLASS_NAME,
          ...getDayClassNames(dayMeta, theme),
          ...(props.extraClassNames || [])
        ]}
        elAttrs={{
          'data-date': !dayMeta.isDisabled ? formatDayString(date) : undefined,
          ...extraDataAttrs,
        }}
        elStyle={{
          width: props.colWidth != null // TODO: DRY
            ? props.colWidth * (props.colSpan || 1)
            : undefined,
        }}
        renderProps={renderProps}
        generatorName="dayHeaderContent"
        customGenerator={options.dayHeaderContent}
        defaultGenerator={renderInner}
        classNameGenerator={options.dayHeaderClassNames}
        didMount={options.dayHeaderDidMount}
        willUnmount={options.dayHeaderWillUnmount}
      >
        {(InnerContainer) => (
          <div ref={props.innerElRef}>
            {!dayMeta.isDisabled && (
              <InnerContainer
                elTag="a"
                elAttrs={navLinkAttrs}
                elClasses={[
                  props.isSticky && 'fcnew-sticky', // TODO: how to do this???
                ]}
              />
            )}
          </div>
        )}
      </ContentContainer>
    )
  }
}
