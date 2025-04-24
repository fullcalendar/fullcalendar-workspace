import { BaseComponent, buildNavLinkAttrs, ContentContainer, DateMarker, DateMeta, formatDayString, getStickyHeaderDates } from "@fullcalendar/core/internal";
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { ListDayHeaderContentArg } from '../structs.js'

export interface ListDayHeaderProps {
  dayDate: DateMarker
  dateMeta: DateMeta
  forPrint: boolean
}

export class ListDayHeader extends BaseComponent<ListDayHeaderProps> {
  render() {
    let { dateEnv, options, viewApi } = this.context
    let { dayDate, dateMeta } = this.props
    let stickyHeaderDates = !this.props.forPrint && getStickyHeaderDates(options)

    // will ever be falsy?
    let text = options.listDayFormat ? dateEnv.format(dayDate, options.listDayFormat) : ''

    // will ever be falsy? also, BAD NAME "alt"
    let sideText = options.listDaySideFormat ? dateEnv.format(dayDate, options.listDaySideFormat) : ''

    let isNavLink = options.navLinks

    let renderProps: ListDayHeaderContentArg = {
      ...dateMeta,
      sticky: stickyHeaderDates,
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

    return (
      <ContentContainer
        tag="div"
        className={stickyHeaderDates ? 'fc-sticky-t' : ''}
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
    )
  }
}

function renderInnerContent(props: ListDayHeaderContentArg) {
  return (
    <Fragment>
      {props.text && (
        <div {...props.navLinkAttrs}>
          {props.text}
        </div>
      )}
      {props.sideText && (
        <div {...props.sideNavLinkAttrs}>
          {props.sideText}
        </div>
      )}
    </Fragment>
  )
}
