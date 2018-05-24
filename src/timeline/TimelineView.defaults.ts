import * as core from 'fullcalendar'
import TimelineView from './TimelineView'

const MIN_AUTO_LABELS = 18 // more than `12` months but less that `24` hours
const MAX_AUTO_SLOTS_PER_LABEL = 6 // allows 6 10-min slots in an hour
const MAX_AUTO_CELLS = 200; // allows 4-days to have a :30 slot duration
(core as any).MAX_TIMELINE_SLOTS = 1000

// potential nice values for slot-duration and interval-duration
const STOCK_SUB_DURATIONS = [ // from largest to smallest
  { years: 1 },
  { months: 1 },
  { days: 1 },
  { hours: 1 },
  { minutes: 30 },
  { minutes: 15 },
  { minutes: 10 },
  { minutes: 5 },
  { minutes: 1 },
  { seconds: 30 },
  { seconds: 15 },
  { seconds: 10 },
  { seconds: 5 },
  { seconds: 1 },
  { milliseconds: 500 },
  { milliseconds: 100 },
  { milliseconds: 10 },
  { milliseconds: 1 }
]


export function initScaleProps(timelineView: TimelineView) {

  timelineView.labelInterval = queryDurationOption(timelineView, 'slotLabelInterval')
  timelineView.slotDuration = queryDurationOption(timelineView, 'slotDuration')

  validateLabelAndSlot(timelineView) // validate after computed grid duration
  ensureLabelInterval(timelineView)
  ensureSlotDuration(timelineView)

  let input = timelineView.opt('slotLabelFormat')
  let rawFormats =
    Array.isArray(input) ?
      input
    : typeof input === 'string' ?
      [ input ]
    :
      computeHeaderFormats(timelineView)

  timelineView.headerFormats = rawFormats.map(function(rawFormat) {
    return core.createFormatter(rawFormat)
  })

  timelineView.isTimeScale = Boolean(timelineView.slotDuration.time)

  let largeUnit = null
  if (!timelineView.isTimeScale) {
    const slotUnit = core.greatestDurationDenominator(timelineView.slotDuration).unit
    if (/year|month|week/.test(slotUnit)) {
      largeUnit = slotUnit
    }
  }
  timelineView.largeUnit = largeUnit

  timelineView.emphasizeWeeks =
    core.isSingleDay(timelineView.slotDuration) &&
    (timelineView.currentRangeAs('weeks') >= 2) &&
    !timelineView.opt('businessHours')

  /*
  console.log('label interval =', timelineView.labelInterval.humanize())
  console.log('slot duration =', timelineView.slotDuration.humanize())
  console.log('header formats =', timelineView.headerFormats)
  console.log('isTimeScale', timelineView.isTimeScale)
  console.log('largeUnit', timelineView.largeUnit)
  */

  let rawSnapDuration = timelineView.opt('snapDuration')
  let snapDuration
  let snapsPerSlot

  if (rawSnapDuration) {
    snapDuration = core.createDuration(rawSnapDuration)
    snapsPerSlot = core.wholeDivideDurations(timelineView.slotDuration, snapDuration)
    // ^ TODO: warning if not whole?
  }

  if (snapsPerSlot == null) {
    snapDuration = timelineView.slotDuration
    snapsPerSlot = 1
  }

  timelineView.snapDuration = snapDuration
  timelineView.snapsPerSlot = snapsPerSlot
}


function queryDurationOption(timelineView: TimelineView, name) {
  const input = timelineView.opt(name)
  if (input != null) {
    const dur = core.createDuration(input)
    if (+dur) {
      return dur
    }
  }
}


function validateLabelAndSlot(timelineView: TimelineView) {
  const { currentUnzonedRange } = timelineView.dateProfile
  const dateEnv = timelineView.calendar.dateEnv

  // make sure labelInterval doesn't exceed the max number of cells
  if (timelineView.labelInterval) {
    const labelCnt = dateEnv.countDurationsBetween(
      currentUnzonedRange.start,
      currentUnzonedRange.end,
      timelineView.labelInterval
    )
    if (labelCnt > (core as any).MAX_TIMELINE_SLOTS) {
      core.warn('slotLabelInterval results in too many cells')
      timelineView.labelInterval = null
    }
  }

  // make sure slotDuration doesn't exceed the maximum number of cells
  if (timelineView.slotDuration) {
    const slotCnt = dateEnv.countDurationsBetween(
      currentUnzonedRange.start,
      currentUnzonedRange.end,
      timelineView.slotDuration
    )
    if (slotCnt > (core as any).MAX_TIMELINE_SLOTS) {
      core.warn('slotDuration results in too many cells')
      timelineView.slotDuration = null
    }
  }

  // make sure labelInterval is a multiple of slotDuration
  if (timelineView.labelInterval && timelineView.slotDuration) {
    const slotsPerLabel = core.wholeDivideDurations(timelineView.labelInterval, timelineView.slotDuration)
    if (slotsPerLabel === null || slotsPerLabel < 1) {
      core.warn('slotLabelInterval must be a multiple of slotDuration')
      return timelineView.slotDuration = null
    }
  }
}


function ensureLabelInterval(timelineView: TimelineView) {
  const { currentUnzonedRange } = timelineView.dateProfile
  const dateEnv = timelineView.calendar.dateEnv
  let { labelInterval } = timelineView

  if (!labelInterval) {

    // compute based off the slot duration
    // find the largest label interval with an acceptable slots-per-label
    let input
    if (timelineView.slotDuration) {
      for (input of STOCK_SUB_DURATIONS) {
        const tryLabelInterval = core.createDuration(input)
        const slotsPerLabel = core.wholeDivideDurations(tryLabelInterval, timelineView.slotDuration)
        if (slotsPerLabel !== null && slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL) {
          labelInterval = tryLabelInterval
          break
        }
      }

      // use the slot duration as a last resort
      if (!labelInterval) {
        labelInterval = timelineView.slotDuration
      }

    // compute based off the view's duration
    // find the largest label interval that yields the minimum number of labels
    } else {
      for (input of STOCK_SUB_DURATIONS) {
        labelInterval = core.createDuration(input)
        const labelCnt = dateEnv.countDurationsBetween(
          currentUnzonedRange.start,
          currentUnzonedRange.end,
          labelInterval
        )
        if (labelCnt >= MIN_AUTO_LABELS) {
          break
        }
      }
    }

    timelineView.labelInterval = labelInterval
  }

  return labelInterval
}


function ensureSlotDuration(timelineView: TimelineView) {
  const { currentUnzonedRange } = timelineView.dateProfile
  const dateEnv = timelineView.calendar.dateEnv
  let { slotDuration } = timelineView

  if (!slotDuration) {
    const labelInterval = ensureLabelInterval(timelineView) // will compute if necessary

    // compute based off the label interval
    // find the largest slot duration that is different from labelInterval, but still acceptable
    for (let input of STOCK_SUB_DURATIONS) {
      const trySlotDuration = core.createDuration(input)
      const slotsPerLabel = core.wholeDivideDurations(labelInterval, trySlotDuration)
      if (slotsPerLabel !== null && slotsPerLabel > 1 && slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL) {
        slotDuration = trySlotDuration
        break
      }
    }

    // only allow the value if it won't exceed the view's # of slots limit
    if (slotDuration) {
      const slotCnt = dateEnv.countDurationsBetween(
        currentUnzonedRange.start,
        currentUnzonedRange.end,
        slotDuration
      )
      if (slotCnt > MAX_AUTO_CELLS) {
        slotDuration = null
      }
    }

    // use the label interval as a last resort
    if (!slotDuration) {
      slotDuration = labelInterval
    }

    timelineView.slotDuration = slotDuration
  }

  return slotDuration
}


function computeHeaderFormats(timelineView: TimelineView) {
  let format1
  let format2
  const { labelInterval } = timelineView
  let unit = core.greatestDurationDenominator(labelInterval).unit
  const weekNumbersVisible = timelineView.opt('weekNumbers')
  let format0 = (format1 = (format2 = null))

  // NOTE: weekNumber computation function wont work

  if ((unit === 'week') && !weekNumbersVisible) {
    unit = 'day'
  }

  // gahhh
  switch (unit) {
    case 'year':
      format0 = { year: 'numeric' } // '2015'
      break

    case 'month':
      if (timelineView.currentRangeAs('years') > 1) {
        format0 = { year: 'numeric' } // '2015'
      }

      format1 = { month: 'short' } // 'Jan'
      break

    case 'week':
      if (timelineView.currentRangeAs('years') > 1) {
        format0 = { year: 'numeric' } // '2015'
      }

      format1 = { week: 'narrow' } // 'Wk4'
      break

    case 'day':
      if (timelineView.currentRangeAs('years') > 1) {
        format0 = { year: 'numeric', month: 'long' } // 'January 2014'
      } else if (timelineView.currentRangeAs('months') > 1) {
        format0 = { month: 'long' } // 'January'
      }

      if (weekNumbersVisible) {
        format1 = { week: 'short' } // 'Wk 4'
      }

      format2 = { weekday: 'narrow', day: 'numeric' } // 'Su 9'
      break

    case 'hour':
      if (weekNumbersVisible) {
        format0 = { week: 'short' } // 'Wk 4'
      }

      if (timelineView.currentRangeAs('days') > 1) {
        format1 = { weekday: 'short', day: 'numeric', month: 'numeric' }
      }

      format2 = {
        // like "h(:mm)a" -> "6pm" / "6:30pm"
        hour: 'numeric',
        minute: '2-digit',
        // TODO: omit minute if possible
      }
      break

    case 'minute':
      // sufficiently large number of different minute cells?
      // TODO
      if ((core.asRoughMinutes(labelInterval) / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = {
          hour: 'numeric'
          // TODO: make like '6pm' ... and will omitting the half hour work?
        }
        format1 = function(params) {
          return ':' + pad(params.date.minute) // ':30'
        }
      } else {
        format0 = {
          hour: 'numeric',
          minute: 'numeric'
          // TODO: make like '6:30pm'
        }
      }
      break

    case 'second':
      // sufficiently large number of different second cells?
      if ((core.asRoughSeconds(labelInterval) / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = { hour: 'numeric', minute: '2-digit' } // '8:30 PM'
        format1 = function(params) {
          return ':' + pad(params.date.second) // ':30'
        }
      } else {
        format0 = { hour: 'numeric', minute: '2-digit', second: '2-digit' } // '8:30:45 PM'
      }
      break

    case 'millisecond':
      format0 = { hour: 'numeric', minute: '2-digit', second: '2-digit' } // '8:30:45 PM'
      format1 = function(params) {
        return '.' + params.millisecond // TODO: pad to 3 digits
      }
      break
  }

  return [].concat(format0 || [], format1 || [], format2 || [])
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}
