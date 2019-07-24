import { formatIsoDay } from 'package-tests/datelib/utils'
import { getDayGridDowEls } from 'package-tests/lib/day-grid'
import { getTimeGridDowEls } from 'package-tests/lib/time-grid'


// date optional
export function getHeadResourceEls(resourceId, date) {
  let datePart = ''

  if (date) {
    if (typeof date === 'string') {
      date = new Date(date)
    }
    datePart = '[data-date="' + formatIsoDay(date) + '"]'
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
  if (viewType === 'timeGrid') {
    return getTimeGridDowEls(dayAbbrev)
  } else {
    return getDayGridDowEls(dayAbbrev)
  }
}
