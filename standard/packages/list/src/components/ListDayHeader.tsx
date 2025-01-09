import { DayHeaderContentArg } from '@fullcalendar/core'
import { BaseComponent, buildNavLinkAttrs, ContentContainer, DateMarker, DateRange, formatDayString, getDateMeta, getDayClassName, getStickyHeaderDates, joinClassNames } from "@fullcalendar/core/internal";
import { createElement, Fragment } from '@fullcalendar/core/preact'

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

    let isNavLink = options.navLinks

    let renderProps: RenderProps = {
      date: dateEnv.toDate(dayDate),
      view: viewApi,
      text,
      sideText,
      navLinkAttrs: isNavLink
        ? buildNavLinkAttrs(this.context, dayDate, undefined, text)
        : {},
      sideNavLinkAttrs: isNavLink
        // duplicate navLink, so does not need to be tabbable
        ? buildNavLinkAttrs(this.context, dayDate, undefined, sideText, /* isTabbable = */ false)
        : {},
      ...dayMeta,
    }

    // TODO: make a reusable HOC for dayHeader (used in daygrid/timegrid too)
    return (
      <div className={joinClassNames(
        'fc-list-day-outer',
        stickyHeaderDates && 'fc-list-day-outer-sticky',
      )}>
        <ContentContainer
          tag="div"
          className={joinClassNames(
            'fc-list-day',
            getDayClassName(dayMeta),
          )}
          attrs={{
            'data-date': formatDayString(dayDate),
            ...(dayMeta.isToday ? { 'aria-current': 'date' } : {}),
          }}
          renderProps={renderProps}
          generatorName="dayHeaderContent"
          customGenerator={options.dayHeaderContent}
          defaultGenerator={renderInnerContent}
          classNameGenerator={options.dayHeaderClassNames}
          didMount={options.dayHeaderDidMount}
          willUnmount={options.dayHeaderWillUnmount}
        />
      </div>
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
    <Fragment>
      {props.text && (
        <div
          className="fc-list-day-text"
          {...props.navLinkAttrs}
        >
          {props.text}
        </div>
      )}
      {props.sideText && (
        <div
          className="fc-list-day-side-text"
          {...props.sideNavLinkAttrs}
        >
          {props.sideText}
        </div>
      )}
    </Fragment>
  )
}
