import { formatIsoDay, ensureDate } from 'package-tests/datelib/utils'
import { getBoundingRect } from 'package-tests/lib/dom-geom'


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
