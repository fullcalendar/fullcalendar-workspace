import { DateMarker, DAY_IDS } from '../datelib/marker.js'
import { rangeContainsMarker, DateRange } from '../datelib/date-range.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { joinClassNames } from '../util/html.js'

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

export function getDayClassName(meta: DateMeta): string {
  return joinClassNames(
    'fc-day',
    `fc-day-${DAY_IDS[meta.dow]}`,
    meta.isDisabled
      ? 'fc-day-disabled'
      : joinClassNames(
          meta.isToday && 'fc-day-today',
          meta.isPast && 'fc-day-past',
          meta.isFuture && 'fc-day-future',
          meta.isOther && 'fc-day-other',
        )
  )
}

export function getSlotClassName(meta: DateMeta): string {
  return joinClassNames(
    'fc-slot',
    `fc-slot-${DAY_IDS[meta.dow]}`,
    meta.isDisabled
      ? 'fc-slot-disabled'
      : joinClassNames(
        meta.isToday && 'fc-slot-today',
        meta.isPast && 'fc-slot-past',
        meta.isFuture && 'fc-slot-future',
      )
  )
}
