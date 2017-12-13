import { getBoundingRect } from './geom'


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


export function getDayGridDayEls(date) {
  date = $.fullCalendar.moment.parseZone(date)
  return $(`.fc-day-grid .fc-day[data-date="${date.format('YYYY-MM-DD')}"]`)
}


// TODO: discourage use
export function getDayGridDowEls(dayAbbrev) {
  return $(`.fc-day-grid .fc-row:first-child td.fc-day.fc-${dayAbbrev}`)
}
