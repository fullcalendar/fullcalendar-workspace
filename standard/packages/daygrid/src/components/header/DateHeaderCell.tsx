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
  watchHeight,
  setRef,
  joinClassNames,
} from '@fullcalendar/core/internal'
import { Ref, createElement } from '@fullcalendar/core/preact'
import { renderInner } from '../util.js'

export interface DateHeaderCellProps {
  dateProfile: DateProfile
  todayRange: DateRange
  date: DateMarker
  navLink: boolean
  dayHeaderFormat: DateFormatter
  isSticky?: boolean
  colSpan?: number

  // render props
  renderProps?: Dictionary
  attrs?: Dictionary
  className?: string

  // dimensions
  colWidth?: number

  // ref
  innerHeightRef?: Ref<number>
}

export class DateHeaderCell extends BaseComponent<DateHeaderCellProps> {
  // internal
  private disconectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { dateProfile, date } = props
    let { dateEnv, options, theme, viewApi } = context

    let dayMeta = getDateMeta(date, props.todayRange, null, dateProfile)
    let text = dateEnv.format(date, props.dayHeaderFormat)
    let navLinkAttrs = (!dayMeta.isDisabled && props.navLink)
      ? buildNavLinkAttrs(context, date)
      : {}

    let renderProps: DayHeaderContentArg = {
      ...props.renderProps,
      ...dayMeta,
      date: dateEnv.toDate(date),
      view: viewApi,
      text,
    }

    return (
      <ContentContainer
        tag='div'
        attrs={{
          ...props.attrs,
          'data-date': !dayMeta.isDisabled ? formatDayString(date) : undefined,
        }}
        className={joinClassNames(
          props.className,
          'fc-header-cell fc-cell fc-flex-column fc-align-center',
          !props.isSticky && 'fc-crop',
          props.colWidth == null && 'fc-liquid',
          ...getDayClassNames(dayMeta, theme),
        )}
        style={{
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
          !dayMeta.isDisabled && (
            <InnerContainer
              tag="a"
              attrs={navLinkAttrs}
              className={joinClassNames(
                'fc-cell-inner fc-flex-column fc-padding-sm',
                props.isSticky && 'fc-sticky-x',
              )}
              elRef={this.handleInnerEl}
            />
          )
        )}
      </ContentContainer>
    )
  }

  handleInnerEl = (innerEl: HTMLElement | null) => {
    if (this.disconectInnerHeight) {
      this.disconectInnerHeight()
      this.disconectInnerHeight = undefined
      setRef(this.props.innerHeightRef, null)
    }

    if (innerEl) {
      this.disconectInnerHeight = watchHeight(innerEl, (height) => {
        setRef(this.props.innerHeightRef, height)
      })
    }
  }
}
