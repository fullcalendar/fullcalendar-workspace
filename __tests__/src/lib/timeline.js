import { formatIsoWithoutTz, ensureDate } from 'package-tests/datelib/utils'
import { getBoundingRect } from 'package-tests/lib/dom-geom'


export function dragResourceTimelineEvent(eventEl, dropInfo) {
  let deferred = $.Deferred()
  let modifiedEvent = null

  currentCalendar.on('eventDragStop', function() {
    setTimeout(function() { // wait for eventDrop to be called
      deferred.resolve(modifiedEvent)
    })
  })

  currentCalendar.on('eventDrop', function(arg) {
    modifiedEvent = arg.event
  })

  eventEl.simulate('drag', {
    localPoint: { left: 2, top: '50%' }, // 2 for zoom
    end: getResourceTimelinePoint(dropInfo.resourceId, dropInfo.date)
  })

  return deferred.promise()
}


export function selectResourceTimeline(startInfo, inclusiveEndInfo) {
  let deferred = $.Deferred()
  let selectInfo = null

  currentCalendar.on('select', function(arg) {
    selectInfo = arg
  })

  $('.fc-body .fc-time-area').simulate('drag', {
    point: getResourceTimelinePoint(startInfo.resourceId, startInfo.date),
    end: getResourceTimelinePoint(inclusiveEndInfo.resourceId, inclusiveEndInfo.date),
    onRelease() {
      setTimeout(function() { // wait for select to fire
        deferred.resolve(selectInfo)
      })
    }
  })

  return deferred.promise()
}


export function getResourceTimelineRect(resourceId, start, end) {
  if (typeof resourceId === 'object') {
    const obj = resourceId;
    ({ resourceId } = obj);
    ({ start } = obj);
    ({ end } = obj)
  }
  const coord0 = getTimelineLeft(start)
  const coord1 = getTimelineLeft(end)
  const rowRect = getBoundingRect(getTimelineRowEl(resourceId))
  return {
    left: Math.min(coord0, coord1),
    right: Math.max(coord0, coord1),
    top: rowRect.top,
    bottom: rowRect.bottom
  }
}


export function getResourceTimelinePoint(resourceId, date) {
  const rowRect = getBoundingRect(getTimelineRowEl(resourceId))
  return {
    left: getTimelineLeft(date),
    top: (rowRect.top + rowRect.bottom) / 2
  }
}


export function getTimelineRect(start, end) {
  if (typeof start === 'object') {
    const obj = start;
    ({ start } = obj);
    ({ end } = obj)
  }
  const coord0 = getTimelineLeft(start)
  const coord1 = getTimelineLeft(end)
  const canvasRect = getBoundingRect($('.fc-body .fc-time-area .fc-scroller-canvas'))
  return {
    left: Math.min(coord0, coord1),
    right: Math.max(coord0, coord1),
    top: canvasRect.top,
    bottom: canvasRect.bottom
  }
}


export function getTimelineLine(date) {
  const contentRect = getBoundingRect($('.fc-body .fc-time-area .fc-content'))
  const left = getTimelineLeft(date)
  return {
    left,
    right: left,
    top: contentRect.top,
    bottom: contentRect.bottom
  }
}

/*
targetDate can be in between slat dates
*/
function getTimelineLeft(targetDate) {
  targetDate = ensureDate(targetDate)

  let slatCoord, slatEl
  const isRtl = $('.fc').hasClass('fc-rtl')
  const borderWidth = 1
  let slatEls = getTimelineSlatEl(targetDate)

  const getLeadingEdge = function(cellEl) {
    if (isRtl) {
      return (cellEl.offset().left + cellEl.outerWidth()) - borderWidth
    } else {
      return cellEl.offset().left + borderWidth
    }
  }

  const getTrailingEdge = function(cellEl) {
    if (isRtl) {
      return cellEl.offset().left - borderWidth
    } else {
      return cellEl.offset().left + borderWidth + cellEl.outerWidth()
    }
  }

  if (slatEls.length === 1) {
    return getLeadingEdge(slatEls)
  }

  slatEls = $('.fc-body .fc-slats td') // all slats
  let slatDate = null
  let prevSlatDate = null

  for (let i = 0; i < slatEls.length; i++) { // traverse earlier to later
    slatEl = slatEls[i]
    slatEl = $(slatEl)

    prevSlatDate = slatDate
    slatDate = ensureDate(slatEl.data('date'))

    // is target time between start of previous slat but before this one?
    if (targetDate < slatDate) {
      // before first slat
      if (!prevSlatDate) {
        return getLeadingEdge(slatEl)
      } else {
        const prevSlatEl = slatEls.eq(i - 1)
        const prevSlatCoord = getLeadingEdge(prevSlatEl)
        slatCoord = getLeadingEdge(slatEl)
        return prevSlatCoord +
          ((slatCoord - prevSlatCoord) *
          ((targetDate - prevSlatDate.valueOf()) / (slatDate.valueOf() - prevSlatDate.valueOf())))
      }
    }
  }

  // target date must be after start date of last slat
  // `slatDate` is set to the start date of the last slat

  // guess the duration of the last slot, based on previous duration
  const slatMsDuration = slatDate.valueOf() - prevSlatDate.valueOf()

  slatCoord = getLeadingEdge(slatEl)
  const slatEndCoord = getTrailingEdge(slatEl)

  return slatCoord + // last slat's starting edge
    ((slatEndCoord - slatCoord) *
    Math.min(1, (targetDate - slatDate.valueOf()) / slatMsDuration)) // don't go past the last slat
}


function getTimelineRowEl(resourceId) {
  return $(`.fc-body .fc-resource-area tr[data-resource-id="${resourceId}"]`)
}


export function getTimelineSlatEl(date) {
  date = ensureDate(date)
  return $('.fc-body .fc-slats td[data-date="' + formatIsoWithoutTz(date) + '"]')
}


export function getTimelineResourceIds() {
  return $('.fc-body .fc-resource-area tr[data-resource-id]').map(function(i, tr) {
    return $(tr).data('resource-id')
  }).get() // jquery -> array
}


export function getTimelineResourceTitles() {
  return $('.fc-body .fc-resource-area tr[data-resource-id] .fc-cell-text').map(function(i, td) {
    return $(td).text()
  }).get() // jquery -> array
}
