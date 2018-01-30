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
  date = $.fullCalendar.moment.parseZone(date)
  return $(`.fc-day-grid .fc-day[data-date="${date.format('YYYY-MM-DD')}"]` +
    '[data-resource-id="' + resourceId + '"]')
}
