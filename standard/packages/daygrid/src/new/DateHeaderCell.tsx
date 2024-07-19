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
import { CLASS_NAME, renderInner } from './util.js'

export interface DateHeaderCellProps {
  date: DateMarker
  extraDataAttrs?: Dictionary
  extraRenderProps?: Dictionary

  navLink: boolean
  dateProfile: DateProfile
  todayRange: DateRange
  dayHeaderFormat: DateFormatter
  colSpan?: number
  colWidth: number | undefined
  isSticky?: boolean
  elRef?: Ref<HTMLElement> // TODO: hook up!
}

export class DateHeaderCell extends BaseComponent<DateHeaderCellProps> {
  render() {
    let { dateEnv, options, theme, viewApi } = this.context
    let { props } = this
    let { dateProfile, date, extraRenderProps, extraDataAttrs } = props
    let dayMeta = getDateMeta(date, props.todayRange, null, dateProfile)

    let classNames = [CLASS_NAME].concat(
      getDayClassNames(dayMeta, theme),
    )
    let text = dateEnv.format(date, props.dayHeaderFormat)

    // if colCnt is 1, we are already in a day-view and don't need a navlink
    let navLinkAttrs = (!dayMeta.isDisabled && props.navLink)
      ? buildNavLinkAttrs(this.context, date)
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
        elTag="th"
        elClasses={classNames}
        elAttrs={{
          role: 'columnheader',
          'data-date': !dayMeta.isDisabled ? formatDayString(date) : undefined,
          ...extraDataAttrs,
        }}
        elStyle={{
          width: props.colWidth === undefined ? undefined : props.colWidth * (props.colSpan || 1),
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
          <div className="fc-scrollgrid-sync-inner">
            {!dayMeta.isDisabled && (
              <InnerContainer
                elTag="a"
                elAttrs={navLinkAttrs}
                elClasses={[
                  'fc-col-header-cell-cushion',
                  props.isSticky && 'fc-sticky',
                ]}
              />
            )}
          </div>
        )}
      </ContentContainer>
    )
  }
}
