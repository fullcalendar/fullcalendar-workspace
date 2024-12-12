import { DayHeaderContentArg } from '@fullcalendar/core'
import { BaseComponent, buildNavLinkAttrs, ContentContainer, DateMarker, DateRange, formatDayString, getDateMeta, getDayClassName, getStickyHeaderDates, joinClassNames } from "@fullcalendar/core/internal";
import { createElement } from '@fullcalendar/core/preact'

export interface ListDayHeaderProps {
  dayDate: DateMarker
  todayRange: DateRange
  forPrint: boolean
}

export class ListDayHeader extends BaseComponent<ListDayHeaderProps> {
  render() {
    let { dateEnv, options, viewApi } = this.context
    let { dayDate, todayRange } = this.props
    let stickyHeaderDates = !this.props.forPrint && getStickyHeaderDates(options)

    let dayMeta = getDateMeta(dayDate, todayRange)

    // will ever be falsy?
    let text = options.listDayFormat ? dateEnv.format(dayDate, options.listDayFormat) : ''

    // will ever be falsy? also, BAD NAME "alt"
    let sideText = options.listDaySideFormat ? dateEnv.format(dayDate, options.listDaySideFormat) : ''

    let renderProps: RenderProps = {
      date: dateEnv.toDate(dayDate),
      view: viewApi,
      text,
      sideText,
      navLinkAttrs: buildNavLinkAttrs(this.context, dayDate),
      sideNavLinkAttrs: buildNavLinkAttrs(this.context, dayDate, 'day', false),
      ...dayMeta,
    }

    // TODO: make a reusable HOC for dayHeader (used in daygrid/timegrid too)
    return (
      <ContentContainer
        tag="div"
        className={joinClassNames(
          'fc-list-day',
          getDayClassName(dayMeta),
        )}
        attrs={{
          'data-date': formatDayString(dayDate),
        }}
        renderProps={renderProps}
        generatorName="dayHeaderContent"
        customGenerator={options.dayHeaderContent}
        defaultGenerator={renderInnerContent}
        classNameGenerator={options.dayHeaderClassNames}
        didMount={options.dayHeaderDidMount}
        willUnmount={options.dayHeaderWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag="div"
            className={joinClassNames(
              'fc-list-day-cell',
              stickyHeaderDates && 'fc-list-day-cell-sticky',
            )}
          />
        )}
      </ContentContainer>
    )
  }
}

// doesn't enforce much since DayCellContentArg allow extra props
interface RenderProps extends DayHeaderContentArg {
  text: string
  sideText: string
}

function renderInnerContent(props: RenderProps) {
  return (
    <div className='fc-list-day-inner'>
      {props.text && (
        <a id={props.textId} className="fc-list-day-text" {...props.navLinkAttrs}>
          {props.text}
        </a>
      )}
      {props.sideText && (/* not keyboard tabbable */
        <a aria-hidden className="fc-list-day-side-text" {...props.sideNavLinkAttrs}>
          {props.sideText}
        </a>
      )}
    </div>
  )
}
