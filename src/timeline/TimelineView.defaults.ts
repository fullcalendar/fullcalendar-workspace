import * as $ from 'jquery'
import * as moment from 'moment'
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
  const type = $.type(input)
  timelineView.headerFormats =
    type === 'array' ?
      input
    : type === 'string' ?
      [ input ]
    :
      computeHeaderFormats(timelineView)

  timelineView.isTimeScale = core.durationHasTime(timelineView.slotDuration)

  let largeUnit = null
  if (!timelineView.isTimeScale) {
    const slotUnit = core.computeGreatestUnit(timelineView.slotDuration)
    if (/year|month|week/.test(slotUnit)) {
      largeUnit = slotUnit
    }
  }
  timelineView.largeUnit = largeUnit

  timelineView.emphasizeWeeks = (timelineView.slotDuration.as('days') === 1) &&
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
  timelineView.snapDuration =
    rawSnapDuration ?
      moment.duration(rawSnapDuration) :
      timelineView.slotDuration

  timelineView.snapsPerSlot = core.divideDurationByDuration(timelineView.slotDuration, timelineView.snapDuration)
}


function queryDurationOption(timelineView: TimelineView, name) {
  const input = timelineView.opt(name)
  if (input != null) {
    const dur = moment.duration(input)
    if (+dur) {
      return dur
    }
  }
}


function validateLabelAndSlot(timelineView: TimelineView) {
  const { currentUnzonedRange } = timelineView.dateProfile

  // make sure labelInterval doesn't exceed the max number of cells
  if (timelineView.labelInterval) {
    const labelCnt = core.divideRangeByDuration(currentUnzonedRange.getStart(), currentUnzonedRange.getEnd(), timelineView.labelInterval)
    if (labelCnt > (core as any).MAX_TIMELINE_SLOTS) {
      core.warn('slotLabelInterval results in too many cells')
      timelineView.labelInterval = null
    }
  }

  // make sure slotDuration doesn't exceed the maximum number of cells
  if (timelineView.slotDuration) {
    const slotCnt = core.divideRangeByDuration(currentUnzonedRange.getStart(), currentUnzonedRange.getEnd(), timelineView.slotDuration)
    if (slotCnt > (core as any).MAX_TIMELINE_SLOTS) {
      core.warn('slotDuration results in too many cells')
      timelineView.slotDuration = null
    }
  }

  // make sure labelInterval is a multiple of slotDuration
  if (timelineView.labelInterval && timelineView.slotDuration) {
    const slotsPerLabel = core.divideDurationByDuration(timelineView.labelInterval, timelineView.slotDuration)
    if (!core.isInt(slotsPerLabel) || (slotsPerLabel < 1)) {
      core.warn('slotLabelInterval must be a multiple of slotDuration')
      return timelineView.slotDuration = null
    }
  }
}


function ensureLabelInterval(timelineView: TimelineView) {
  const { currentUnzonedRange } = timelineView.dateProfile
  let { labelInterval } = timelineView

  if (!labelInterval) {

    // compute based off the slot duration
    // find the largest label interval with an acceptable slots-per-label
    let input
    if (timelineView.slotDuration) {
      for (input of STOCK_SUB_DURATIONS) {
        const tryLabelInterval = moment.duration(input)
        const slotsPerLabel = core.divideDurationByDuration(tryLabelInterval, timelineView.slotDuration)
        if (core.isInt(slotsPerLabel) && (slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL)) {
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
        labelInterval = moment.duration(input)
        const labelCnt = core.divideRangeByDuration(currentUnzonedRange.getStart(), currentUnzonedRange.getEnd(), labelInterval)
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
  let { slotDuration } = timelineView

  if (!slotDuration) {
    const labelInterval = ensureLabelInterval(timelineView) // will compute if necessary

    // compute based off the label interval
    // find the largest slot duration that is different from labelInterval, but still acceptable
    for (let input of STOCK_SUB_DURATIONS) {
      const trySlotDuration = moment.duration(input)
      const slotsPerLabel = core.divideDurationByDuration(labelInterval, trySlotDuration)
      if (core.isInt(slotsPerLabel) && (slotsPerLabel > 1) && (slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL)) {
        slotDuration = trySlotDuration
        break
      }
    }

    // only allow the value if it won't exceed the view's # of slots limit
    if (slotDuration) {
      const slotCnt = core.divideRangeByDuration(currentUnzonedRange.getStart(), currentUnzonedRange.getEnd(), slotDuration)
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
  let unit = core.computeGreatestUnit(labelInterval)
  const weekNumbersVisible = timelineView.opt('weekNumbers')
  let format0 = (format1 = (format2 = null))

  // NOTE: weekNumber computation function wont work

  if ((unit === 'week') && !weekNumbersVisible) {
    unit = 'day'
  }

  switch (unit) {
    case 'year':
      format0 = 'YYYY' // '2015'
      break

    case 'month':
      if (timelineView.currentRangeAs('years') > 1) {
        format0 = 'YYYY' // '2015'
      }

      format1 = 'MMM' // 'Jan'
      break

    case 'week':
      if (timelineView.currentRangeAs('years') > 1) {
        format0 = 'YYYY' // '2015'
      }

      format1 = timelineView.opt('shortWeekFormat') // 'Wk4'
      break

    case 'day':
      if (timelineView.currentRangeAs('years') > 1) {
        format0 = timelineView.opt('monthYearFormat') // 'January 2014'
      } else if (timelineView.currentRangeAs('months') > 1) {
        format0 = 'MMMM' // 'January'
      }

      if (weekNumbersVisible) {
        format1 = timelineView.opt('weekFormat') // 'Wk 4'
      }

      // TODO: would use smallDayDateFormat but the way timeline does RTL,
      // we don't want the text to be flipped
      format2 = 'dd D' // @opt('smallDayDateFormat') # 'Su 9'
      break

    case 'hour':
      if (weekNumbersVisible) {
        format0 = timelineView.opt('weekFormat') // 'Wk 4'
      }

      if (timelineView.currentRangeAs('days') > 1) {
        format1 = timelineView.opt('dayOfMonthFormat') // 'Fri 9/15'
      }

      format2 = timelineView.opt('smallTimeFormat') // '6pm'
      break

    case 'minute':
      // sufficiently large number of different minute cells?
      if ((labelInterval.asMinutes() / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = timelineView.opt('hourFormat') // '6pm'
        format1 = '[:]mm' // ':30'
      } else {
        format0 = timelineView.opt('mediumTimeFormat') // '6:30pm'
      }
      break

    case 'second':
      // sufficiently large number of different second cells?
      if ((labelInterval.asSeconds() / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = 'LT' // '8:30 PM'
        format1 = '[:]ss' // ':30'
      } else {
        format0 = 'LTS' // '8:30:45 PM'
      }
      break

    case 'millisecond':
      format0 = 'LTS' // '8:30:45 PM'
      format1 = '[.]SSS' // '750'
      break
  }

  return [].concat(format0 || [], format1 || [], format2 || [])
}
