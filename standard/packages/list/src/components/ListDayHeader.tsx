import { BaseComponent, ContentContainer, DateFormatter, DateMarker, DateMeta, formatDayString, ViewSpec, WEEKDAY_ONLY_FORMAT, FULL_DATE_FORMAT } from "@fullcalendar/core/internal";
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { ListDayHeaderData } from '../structs.js'
import { ListDayHeaderInner } from "./ListDayHeaderInner.js";

export interface ListDayHeaderProps {
  dayDate: DateMarker
  dateMeta: DateMeta
  forPrint: boolean
}

export class ListDayHeader extends BaseComponent<ListDayHeaderProps> {
  render() {
    let { options, viewApi, viewSpec } = this.context
    let { dayDate, dateMeta } = this.props
    let stickyHeaderDates = !this.props.forPrint

    const listDayFormat = options.listDayFormat ?? createDefaultListDayFormat(viewSpec)
    const listDaySideFormat = options.listDaySideFormat ?? createDefaultListDaySideFormat(viewSpec)

    let renderProps: ListDayHeaderData = {
      ...dateMeta,
      view: viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          'data-date': formatDayString(dayDate),
          ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}),
        }}
        className={stickyHeaderDates ? classNames.stickyT : ''}
        renderProps={renderProps}
        generatorName={undefined}
        classNameGenerator={options.listDayHeaderClass}
        didMount={options.listDayHeaderDidMount}
        willUnmount={options.listDayHeaderWillUnmount}
      >
        {() => (
          <Fragment>
            {Boolean(listDayFormat) && (
              <ListDayHeaderInner
                dayDate={dayDate}
                dayFormat={listDayFormat}
                isTabbable
                dateMeta={dateMeta}
                level={0}
              />
            )}
            {Boolean(listDaySideFormat) && (
              <ListDayHeaderInner
                dayDate={dayDate}
                dayFormat={listDaySideFormat}
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

function createDefaultListDayFormat({ durationUnit, singleUnit }: ViewSpec): DateFormatter {
  if (singleUnit === 'day') {
    return WEEKDAY_ONLY_FORMAT
  } else if (durationUnit === 'day' || singleUnit === 'week') {
    return WEEKDAY_ONLY_FORMAT
  } else {
    return FULL_DATE_FORMAT
  }
}

function createDefaultListDaySideFormat({ durationUnit, singleUnit }: ViewSpec): DateFormatter {
  if (singleUnit === 'day') {
    // nothing b/c full date is probably in headerToolbar
  } else if (durationUnit === 'day' || singleUnit === 'week') {
    return FULL_DATE_FORMAT
  } else {
    return WEEKDAY_ONLY_FORMAT
  }
}
