import { getBoundingRect } from './geom'

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


export function getTimeGridPoint(date) {
  date = $.fullCalendar.moment.parseZone(date)

  const dayEls = getTimeGridDayEls(date)
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

/*
targetTime is a time (duration) that can be in between slots
*/
function getTimeGridTop(targetTime) {
  let slotEl
  targetTime = moment.duration(targetTime)
  let slotEls = getTimeGridSlotEls(targetTime)
  const topBorderWidth = 1 // TODO: kill

  // exact slot match
  if (slotEls.length === 1) {
    return slotEls.eq(0).offset().top + topBorderWidth
  }

  slotEls = $('.fc-time-grid .fc-slats tr[data-time]') // all slots
  let slotTime = null
  let prevSlotTime = null

  for (let i = 0; i < slotEls.length; i++) { // traverse earlier to later
    slotEl = slotEls[i]
    slotEl = $(slotEl)

    prevSlotTime = slotTime
    slotTime = moment.duration(slotEl.data('time'))

    // is target time between start of previous slot but before this one?
    if (targetTime < slotTime) {
      // before first slot
      if (!prevSlotTime) {
        return slotEl.offset().top + topBorderWidth
      } else {
        const prevSlotEl = slotEls.eq(i - 1)
        return prevSlotEl.offset().top + // previous slot top
          topBorderWidth +
          (prevSlotEl.outerHeight() *
          ((targetTime - prevSlotTime) / (slotTime - prevSlotTime)))
      }
    }
  }

  // target time must be after the start time of the last slot.
  // `slotTime` is set to the start time of the last slot.

  // guess the duration of the last slot, based on previous duration
  const slotMsDuration = slotTime - prevSlotTime

  return slotEl.offset().top + // last slot's top
    topBorderWidth +
    (slotEl.outerHeight() *
    Math.min(1, (targetTime - slotTime) / slotMsDuration)) // don't go past end of last slot
};


function getResourceTimeGridDayEls(resourceId, date) {
  date = $.fullCalendar.moment.parseZone(date)
  return $(`.fc-time-grid .fc-day[data-date="${date.format('YYYY-MM-DD')}"]` +
    '[data-resource-id="' + resourceId + '"]')
}


function getTimeGridDayEls(date) {
  date = $.fullCalendar.moment.parseZone(date)
  return $(`.fc-time-grid .fc-day[data-date="${date.format('YYYY-MM-DD')}"]`)
}


function getTimeGridSlotEls(timeDuration) {
  timeDuration = moment.duration(timeDuration)
  const date = $.fullCalendar.moment.utc('2016-01-01').time(timeDuration)
  if (date.date() === 1) { // ensure no time overflow/underflow
    return $(`.fc-time-grid .fc-slats tr[data-time="${date.format('HH:mm:ss')}"]`)
  } else {
    return $()
  }
}


export function getTimeGridResourceIds() {
  return $('.fc-agenda-view .fc-head .fc-resource-cell').map(function(i, th) {
    return $(th).data('resource-id')
  }).get() // jQuery -> array
}


// TODO: discourage use
export function getTimeGridDowEls(dayAbbrev) {
  return $(`.fc-time-grid .fc-day.fc-${dayAbbrev}`)
}
