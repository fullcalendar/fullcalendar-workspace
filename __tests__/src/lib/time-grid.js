import { startOfDay } from '@fullcalendar/core'
import { formatIsoDay, ensureDate } from 'package-tests/datelib/utils'
import { getBoundingRect } from 'package-tests/lib/dom-geom'
import { getTimeGridTop } from 'package-tests/lib/time-grid'

/*
for a single segment
*/
export function getResourceTimeGridRect(resourceId, start, end) {
  if (typeof resourceId === 'object') {
    const obj = resourceId;
    ({ resourceId } = obj);
    ({ start } = obj);
    ({ end } = obj)
  }

  start = ensureDate(start)
  end = ensureDate(end)

  const startDay = startOfDay(start)
  const startTimeMs = start.valueOf() - startDay.valueOf()
  const endDay = startOfDay(end)
  const endTimeMs =
    (startDay.valueOf() === endDay.valueOf())
      ? end.valueOf() - endDay.valueOf()
      : end < start
        ? startTimeMs
        : (1000 * 60 * 60 * 24) // 1 day

  const dayEls = getResourceTimeGridDayEls(resourceId, start)
  if (dayEls.length === 1) {
    const dayRect = getBoundingRect(dayEls.eq(0))
    return {
      left: dayRect.left,
      right: dayRect.right,
      top: getTimeGridTop(startTimeMs),
      bottom: getTimeGridTop(endTimeMs)
    }
  }
}


export function getResourceTimeGridPoint(resourceId, date) {
  date = ensureDate(date)

  const day = startOfDay(date)
  const timeMs = date.valueOf() - day.valueOf()
  const dayEls = getResourceTimeGridDayEls(resourceId, date)

  if (dayEls.length === 1) {
    const dayRect = getBoundingRect(dayEls.eq(0))

    return {
      left: (dayRect.left + dayRect.right) / 2,
      top: getTimeGridTop(timeMs)
    }
  } else {
    return null
  }
}


function getResourceTimeGridDayEls(resourceId, date) {
  date = ensureDate(date)
  return $(
    '.fc-time-grid .fc-day[data-date="' + formatIsoDay(date) + '"]' +
    '[data-resource-id="' + resourceId + '"]'
  )
}


export function getTimeGridResourceIds() {
  return $('.fc-timeGrid-view .fc-head .fc-resource-cell').map(function(i, th) {
    return $(th).data('resource-id')
  }).get() // jQuery -> array
}
