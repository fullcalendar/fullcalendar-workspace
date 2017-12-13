import { getDayGridDowEls } from './day-grid'
import { getTimeGridDowEls } from './time-grid'

// function getHeadDateEls(date) {
//   date = $.fullCalendar.moment.parseZone(date)
//   return $(`.fc-day-header[data-date="${date.format('YYYY-MM-DD')}"]`)
// }


// date optional
export function getHeadResourceEls(resourceId, date) {
  let datePart = ''
  if (date) {
    date = $.fullCalendar.moment.parseZone(date)
    datePart = `[data-date="${date.format('YYYY-MM-DD')}"]`
  }
  return $('.fc-resource-cell[data-resource-id="' + resourceId + '"]' + datePart)
}


// // either a day cell OR a resource cell
// function getHeadResourceTh(resourceId, date) {
//   date = $.fullCalendar.moment.parseZone(date)
//   return $(`th[data-resource-id="${resourceId}"][data-date="${date.format('YYYY-MM-DD')}"]`)
// }


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


// // resourceId is required
// function getHeadResourceDateEls(date, resourceId) {
//   date = $.fullCalendar.moment.parseZone(date)
//   return $('.fc-day-header' +
//     '[data-date="' + date.format('YYYY-MM-DD') + '"]' +
//     '[data-resource-id="' + resourceId + '"]')
// }


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
