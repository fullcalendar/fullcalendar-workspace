import { BaseComponent, ContentContainer, DateMarker, DateMeta, formatDayString, generateClassName, getStickyHeaderDates } from "@fullcalendar/core/internal";
import { createElement, Fragment } from '@fullcalendar/core/preact'
import classNames from '@fullcalendar/core/internal-classnames'
import { ListDayHeaderArg } from '../structs.js'
import { ListDayHeaderInner } from "./ListDayHeaderInner.js";

export interface ListDayHeaderProps {
  dayDate: DateMarker
  dateMeta: DateMeta
  forPrint: boolean
}

export class ListDayHeader extends BaseComponent<ListDayHeaderProps> {
  render() {
    let { options, viewApi } = this.context
    let { dayDate, dateMeta } = this.props
    let stickyHeaderDates = !this.props.forPrint && getStickyHeaderDates(options)

    let renderProps: ListDayHeaderArg = {
      ...dateMeta,
      isSticky: stickyHeaderDates,
      view: viewApi,
    }
    let beforeClassNames: string = generateClassName(
      options.listDayHeaderBeforeClassNames,
      renderProps,
    )

    return (
      <ContentContainer
        tag="div"
        className={stickyHeaderDates ? classNames.stickyT : ''}
        attrs={{
          'data-date': formatDayString(dayDate),
          ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}),
        }}
        renderProps={renderProps}
        generatorName={undefined}
        classNameGenerator={options.listDayHeaderClassNames}
        didMount={options.listDayHeaderDidMount}
        willUnmount={options.listDayHeaderWillUnmount}
      >
        {() => (
          <Fragment>
            {Boolean(beforeClassNames) && (
              <div className={beforeClassNames} />
            )}
            {Boolean(options.listDayFormat) && (
              <ListDayHeaderInner
                dayDate={dayDate}
                dayFormat={options.listDayFormat}
                isTabbable
                dateMeta={dateMeta}
              />
            )}
            {Boolean(options.listDaySideFormat) && (
              <ListDayHeaderInner
                dayDate={dayDate}
                dayFormat={options.listDaySideFormat}
                isTabbable={false}
                dateMeta={dateMeta}
              />
            )}
          </Fragment>
        )}
      </ContentContainer>
    )
  }
}
