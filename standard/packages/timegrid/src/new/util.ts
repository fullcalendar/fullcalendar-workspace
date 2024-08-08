import { Duration } from '@fullcalendar/core'
import { asRoughMs, createDuration, DateEnv, DateMarker, DateProfile, DateProfileGenerator, DateRange, DaySeriesModel, DayTableModel, startOfDay } from "@fullcalendar/core/internal"

export function buildTimeColsModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator) {
  let daySeries = new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator)

  return new DayTableModel(daySeries, false)
}

export function buildDayRanges(dayTableModel: DayTableModel, dateProfile: DateProfile, dateEnv: DateEnv): DateRange[] {
  let ranges: DateRange[] = []

  for (let date of dayTableModel.headerDates) {
    ranges.push({
      start: dateEnv.add(date, dateProfile.slotMinTime),
      end: dateEnv.add(date, dateProfile.slotMaxTime),
    })
  }

  return ranges
}

export function computeSlatHeight(
  verticalScrolling: boolean,
  expandRows: boolean,
  slatCnt: number,
  slatInnerHeight: number | undefined,
  scrollerHeight: number | undefined,
): [
  slatHeight: number | undefined,
  slatLiquid: boolean,
] {
  if (!slatInnerHeight || !scrollerHeight) {
    return [undefined, false]
  }

  const slatMinHeight = slatInnerHeight + 1
  const slatTryHeight = scrollerHeight / slatCnt
  let slatLiquid: boolean
  let slatHeight: number

  if (verticalScrolling && expandRows && slatTryHeight >= slatMinHeight) {
    slatLiquid = true
    slatHeight = slatTryHeight
  } else {
    slatLiquid = false
    slatHeight = Math.max(slatMinHeight, slatTryHeight)
  }

  return [slatHeight, slatLiquid]
}

/*
A `startOfDayDate` must be given for avoiding ambiguity over how to treat midnight.
*/
export function computeDateTopFrac(
  date: DateMarker,
  dateProfile: DateProfile,
  startOfDayDate?: DateMarker,
): number {
  if (!startOfDayDate) {
    startOfDayDate = startOfDay(date)
  }
  return computeTimeTopFrac(
    createDuration(date.valueOf() - startOfDayDate.valueOf()),
    dateProfile,
  )
}

export function computeTimeTopFrac(time: Duration, dateProfile: DateProfile): number {
  const startMs = asRoughMs(dateProfile.slotMinTime)
  const endMs = asRoughMs(dateProfile.slotMaxTime)
  let frac = (time.milliseconds - startMs) / (endMs - startMs)

  frac = Math.max(0, frac)
  frac = Math.min(1, frac)

  return frac
}
