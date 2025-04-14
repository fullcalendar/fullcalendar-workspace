import { BaseComponent, buildNavLinkAttrs, ContentContainer, DateMarker, DateRange, formatDayString, getDateMeta, getStickyHeaderDates, joinClassNames } from "@fullcalendar/core/internal";
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { ListDayHeaderContentArg } from '../structs.js'

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

    let dateMeta = getDateMeta(dayDate, dateEnv, undefined, todayRange)

    // will ever be falsy?
    let text = options.listDayFormat ? dateEnv.format(dayDate, options.listDayFormat) : ''

    // will ever be falsy? also, BAD NAME "alt"
    let sideText = options.listDaySideFormat ? dateEnv.format(dayDate, options.listDaySideFormat) : ''

    let isNavLink = options.navLinks

    let renderProps: ListDayHeaderContentArg = {
      ...dateMeta,
      isMajor: false,
      text,
      sideText,
      view: viewApi,
      navLinkAttrs: isNavLink
        ? buildNavLinkAttrs(this.context, dayDate, undefined, text)
        : {},
      sideNavLinkAttrs: isNavLink
        // duplicate navLink, so does not need to be tabbable
        ? buildNavLinkAttrs(this.context, dayDate, undefined, sideText, /* isTabbable = */ false)
        : {},
    }

    // TODO: make a reusable HOC for dayHeader (used in daygrid/timegrid too)
    return (
      <div className={joinClassNames(
        'fc-list-day-outer',
        stickyHeaderDates && 'fc-list-day-outer-sticky',
      )}>
        <ContentContainer
          tag="div"
          className='fc-list-day'
          attrs={{
            'data-date': formatDayString(dayDate),
            ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}),
          }}
          renderProps={renderProps}
          generatorName="listDayHeaderContent"
          customGenerator={options.listDayHeaderContent}
          defaultGenerator={renderInnerContent}
          classNameGenerator={options.listDayHeaderClassNames}
          didMount={options.listDayHeaderDidMount}
          willUnmount={options.listDayHeaderWillUnmount}
        />
      </div>
    )
  }
}

function renderInnerContent(props: ListDayHeaderContentArg) {
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
