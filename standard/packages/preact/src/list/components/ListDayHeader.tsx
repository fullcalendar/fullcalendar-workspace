import { memo } from 'react'
import { useViewContext } from '../../context/useViewContext'
import { useRenderHookEl } from '../../render-hook/useRenderHookEl'
import { joinClassNames } from '../../util/html'
import type { DateFormatter, DateMarker } from '@full-ui/headless-calendar'
import type { DateMeta } from '../../date-profile/date-meta'
import { formatDayString } from '@full-ui/headless-calendar'
import type { ViewSpec } from '../../views/view-spec'
import { WEEKDAY_ONLY_FORMAT, FULL_DATE_FORMAT } from '../../util/date-format'
import classNames from '../../styles.module.css'
import { ListDayHeaderInfo } from '../info-types'
import { ListDayHeaderInner } from "./ListDayHeaderInner"

export interface ListDayHeaderProps {
  dayDate: DateMarker
  dateMeta: DateMeta
  forPrint: boolean
}

export const ListDayHeader = memo(function ListDayHeader(props: ListDayHeaderProps) {
  let { options, viewApi, viewSpec } = useViewContext()
  let { dayDate, dateMeta } = props
  let stickyHeaderDates = !props.forPrint

  const listDayFormat = options.listDayFormat ?? createDefaultListDayFormat(viewSpec)
  const listDayAltFormat = options.listDayAltFormat ?? createDefaultListDaySideFormat(viewSpec)

  let renderProps: ListDayHeaderInfo = {
    ...dateMeta,
    view: viewApi,
  }
  let renderHookEl = useRenderHookEl({
    classGenerator: options.listDayHeaderClass,
    didMount: options.listDayHeaderDidMount,
    willUnmount: options.listDayHeaderWillUnmount,
    renderProps,
  })

  return (
    <div
      ref={renderHookEl.ref}
      data-date={formatDayString(dayDate)}
      aria-current={dateMeta.isToday ? 'date' : undefined}
      className={joinClassNames(renderHookEl.className, stickyHeaderDates && classNames.stickyT) || undefined}
    >
      {Boolean(listDayFormat) && (
        <ListDayHeaderInner
          dayDate={dayDate}
          dayFormat={listDayFormat}
          isTabbable
          dateMeta={dateMeta}
          level={0}
        />
      )}
      {Boolean(listDayAltFormat) && (
        <ListDayHeaderInner
          dayDate={dayDate}
          dayFormat={listDayAltFormat}
          isTabbable={false}
          dateMeta={dateMeta}
          level={1}
        />
      )}
    </div>
  )
})

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
