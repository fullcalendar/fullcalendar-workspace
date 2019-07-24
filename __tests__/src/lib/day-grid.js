import { formatIsoDay, ensureDate } from 'fullcalendar/tests/automated/datelib/utils'
import { getBoundingRect } from 'fullcalendar/tests/automated/lib/dom-geom'


export function getResourceDayGridRect(resourceId, date) {

  if (typeof resourceId === 'object') {
    const obj = resourceId;
    ({ resourceId } = obj);
    ({ date } = obj)
  }

  const dayEl = getResourceDayGridDayEls(resourceId, date)
  return getBoundingRect(dayEl)
}


export function getResourceDayGridDayEls(resourceId, date) {
  date = ensureDate(date)
  return $(
    '.fc-day-grid .fc-day[data-date="' + formatIsoDay(date) + '"]' +
    '[data-resource-id="' + resourceId + '"]'
  )
}
