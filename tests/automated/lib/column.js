import { getDayGridDowEls } from 'fullcalendar/tests/automated/lib/day-grid'
import { getTimeGridDowEls } from 'fullcalendar/tests/automated/lib/time-grid'


// date optional
export function getHeadResourceEls(resourceId, date) {
  let datePart = ''
  if (date) {
    date = $.fullCalendar.moment.parseZone(date)
    datePart = `[data-date="${date.format('YYYY-MM-DD')}"]`
  }
  return $('.fc-resource-cell[data-resource-id="' + resourceId + '"]' + datePart)
}


export function getHeadResourceIds() {
  return $('th.fc-resource-cell').map(function(i, th) {
    return $(th).data('resource-id')
  }).get() // jQuery -> Array
}


export function getHeadResourceTitles() {
  return $('th.fc-resource-cell').map(function(i, th) {
    return $(th).text()
  }).get() // jQuery -> Array
}


// TODO: discourage use
export function getHeadDowEls(dayAbbrev) {
  return $(`.fc-day-header.fc-${dayAbbrev}`)
}


// TODO: discourage use
export function getBodyDowEls(dayAbbrev, viewType) {
  if (viewType === 'agenda') {
    return getTimeGridDowEls(dayAbbrev)
  } else {
    return getDayGridDowEls(dayAbbrev)
  }
}
