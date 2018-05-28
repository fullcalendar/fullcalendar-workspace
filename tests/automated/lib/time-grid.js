import { formatIsoDay } from 'fullcalendar/tests/automated/datelib/utils'
import { getBoundingRect } from 'fullcalendar/tests/automated/lib/dom-geom'
import { getTimeGridTop } from 'fullcalendar/tests/automated/lib/time-grid'

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

  if (typeof start === 'string') {
    start = new Date(start)
  }
  if (typeof end === 'string') {
    end = new Date(end)
  }

  const startDay = FullCalendar.startOfDay(start)
  const startTimeMs = start.valueOf() - startDay.valueOf()
  const endDay = FullCalendar.startOfDay(end)
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

  if (typeof date === 'string') {
    date = new Date(date)
  }

  const day = FullCalendar.startOfDay(date)
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
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return $(
    '.fc-time-grid .fc-day[data-date="' + formatIsoDay(date) + '"]' +
    '[data-resource-id="' + resourceId + '"]'
  )
}


export function getTimeGridResourceIds() {
  return $('.fc-agenda-view .fc-head .fc-resource-cell').map(function(i, th) {
    return $(th).data('resource-id')
  }).get() // jQuery -> array
}
