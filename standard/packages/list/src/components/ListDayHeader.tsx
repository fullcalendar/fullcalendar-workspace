import { BaseComponent, ContentContainer, DateMarker, DateMeta, formatDayString, getStickyHeaderDates } from "@fullcalendar/core/internal";
import { createElement, Fragment } from '@fullcalendar/core/preact'
import classNames from '@fullcalendar/core/internal-classnames'
import { ListDayHeaderData } from '../structs.js'
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

    let renderProps: ListDayHeaderData = {
      ...dateMeta,
      view: viewApi,
    }

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
        classNameGenerator={options.listDayHeaderClass}
        didMount={options.listDayHeaderDidMount}
        willUnmount={options.listDayHeaderWillUnmount}
      >
        {() => (
          <Fragment>
            {Boolean(options.listDayFormat) && (
              <ListDayHeaderInner
                dayDate={dayDate}
                dayFormat={options.listDayFormat}
                isTabbable
                dateMeta={dateMeta}
                level={0}
              />
            )}
            {Boolean(options.listDaySideFormat) && (
              <ListDayHeaderInner
                dayDate={dayDate}
                dayFormat={options.listDaySideFormat}
                isTabbable={false}
                dateMeta={dateMeta}
                level={1}
              />
            )}
          </Fragment>
        )}
      </ContentContainer>
    )
  }
}
