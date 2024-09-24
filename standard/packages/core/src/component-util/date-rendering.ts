import { DateMarker, DAY_IDS } from '../datelib/marker.js'
import { rangeContainsMarker, DateRange } from '../datelib/date-range.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { Theme } from '../theme/Theme.js'

export interface DateMeta {
  dow: number
  isDisabled: boolean
  isOther: boolean // like, is it in the non-current "other" month
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}

export function getDateMeta(date: DateMarker, todayRange?: DateRange, nowDate?: DateMarker, dateProfile?: DateProfile): DateMeta {
  return {
    dow: date.getUTCDay(),
    isDisabled: Boolean(dateProfile && !rangeContainsMarker(dateProfile.activeRange, date)),
    isOther: Boolean(dateProfile && !rangeContainsMarker(dateProfile.currentRange, date)),
    isToday: Boolean(todayRange && rangeContainsMarker(todayRange, date)),
    isPast: Boolean(nowDate ? (date < nowDate) : todayRange ? (date < todayRange.start) : false),
    isFuture: Boolean(nowDate ? (date > nowDate) : todayRange ? (date >= todayRange.end) : false),
  }
}

export function getDayClassNames(meta: DateMeta, theme: Theme) {
  let classNames: string[] = [
    'fcnew-day',
    `fcnew-day-${DAY_IDS[meta.dow]}`,
  ]

  if (meta.isDisabled) {
    classNames.push('fcnew-day-disabled')
  } else {
    if (meta.isToday) {
      classNames.push('fcnew-day-today')
    }

    if (meta.isPast) {
      classNames.push('fcnew-day-past')
    }

    if (meta.isFuture) {
      classNames.push('fcnew-day-future')
    }

    if (meta.isOther) {
      classNames.push('fcnew-day-other')
    }
  }

  return classNames
}

export function getSlotClassNames(meta: DateMeta, theme: Theme) {
  let classNames: string[] = [
    'fcnew-slot',
    `fcnew-slot-${DAY_IDS[meta.dow]}`,
  ]

  if (meta.isDisabled) {
    classNames.push('fcnew-slot-disabled')
  } else {
    if (meta.isToday) {
      classNames.push('fcnew-slot-today')
    }

    if (meta.isPast) {
      classNames.push('fcnew-slot-past')
    }

    if (meta.isFuture) {
      classNames.push('fcnew-slot-future')
    }
  }

  return classNames
}
