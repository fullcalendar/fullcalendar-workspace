import { DateEnv, DateProfile, DateProfileGenerator, DateRange, DaySeriesModel, DayTableModel } from "@fullcalendar/core/internal"

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
  scrollerHeight: number,
  slatCnt: number,
  slatInnerHeight: number,
): [
  slatHeight: number,
  slatLiquid: boolean,
] {
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
