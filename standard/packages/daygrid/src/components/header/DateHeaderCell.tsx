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
} from '@fullcalendar/core/internal'
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'
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
  extraRenderProps?: Dictionary
  extraDataAttrs?: Dictionary
  extraClassNames?: string[]

  // dimensions
  colWidth?: number

  // ref
  innerHeightRef?: Ref<number>
}

export class DateHeaderCell extends BaseComponent<DateHeaderCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconectInnerHeight?: () => void

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
        elTag='div'
        elClasses={[
          ...getDayClassNames(dayMeta, theme),
          ...(props.extraClassNames || []),
          'fc-header-cell',
          'fc-cell',
          props.colWidth != null ? '' : 'fc-liquid',
          'fc-flex-column',
          'fc-align-center',
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
          <div
            ref={this.innerElRef}
            className={[
              'fc-flex-column',
              props.isSticky ? 'fc-sticky-x' : '',
            ].join(' ')}
          >
            {!dayMeta.isDisabled && (
              <InnerContainer
                elTag="a"
                elAttrs={navLinkAttrs}
                elClasses={[
                  'fc-cell-inner',
                  'fc-padding-sm',
                ]}
              />
            )}
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.disconectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
