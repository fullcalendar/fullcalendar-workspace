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

  start = $.fullCalendar.moment.parseZone(start)
  end = $.fullCalendar.moment.parseZone(end)

  const startTime = start.time()
  const endTime =
    end.isSame(start, 'day')
      ? end.time()
      : end < start
        ? startTime
        : moment.duration({ hours: 24 })

  const dayEls = getResourceTimeGridDayEls(resourceId, start)
  if (dayEls.length === 1) {
    const dayRect = getBoundingRect(dayEls.eq(0))
    return {
      left: dayRect.left,
      right: dayRect.right,
      top: getTimeGridTop(startTime),
      bottom: getTimeGridTop(endTime)
    }
  }
}


export function getResourceTimeGridPoint(resourceId, date) {
  date = $.fullCalendar.moment.parseZone(date)

  const dayEls = getResourceTimeGridDayEls(resourceId, date)
  if (dayEls.length === 1) {
    const dayRect = getBoundingRect(dayEls.eq(0))
    return {
      left: (dayRect.left + dayRect.right) / 2,
      top: getTimeGridTop(date.time())
    }
  } else {
    return null
  }
}


function getResourceTimeGridDayEls(resourceId, date) {
  date = $.fullCalendar.moment.parseZone(date)
  return $(`.fc-time-grid .fc-day[data-date="${date.format('YYYY-MM-DD')}"]` +
    '[data-resource-id="' + resourceId + '"]')
}


export function getTimeGridResourceIds() {
  return $('.fc-agenda-view .fc-head .fc-resource-cell').map(function(i, th) {
    return $(th).data('resource-id')
  }).get() // jQuery -> array
}
