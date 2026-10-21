import { DateMarker, addDays, diffDays, DateRange } from '@full-ui/headless-calendar'
import { SlicedCoordRange } from '../../coord-range'
import { HiddenDays } from '../../structs/hidden-days'

/*
The dates of a range minus its hidden days: one per rendered column, left to right
*/
export interface DaySeries {
  cnt: number
  dates: DateMarker[] // whole-day dates for each column. left to right
  // the columns a range covers, its endpoints clamped inward off hidden days. null if it covers none
  sliceRange(range: DateRange): SlicedCoordRange | null
}

/*
A hidden day occupies a slot in `entries` (so a date can still be located by its offset from
range.start) but owns no index in `dates`. It records the visible indices on either side of
it, which is how sliceRange clamps a span whose endpoint lands on a hidden day inward to the
nearest rendered column.
*/
type DaySeriesEntry =
  { kind: 'visible', index: number } |
  { kind: 'hidden', previousIndex: number, nextIndex: number }

type DayIndexResult =
  DaySeriesEntry |
  { kind: 'before', index: -1 } |
  { kind: 'after', index: number }

// `hiddenDays` is the generator's (DateProfileGenerator.hiddenDays), so a subclass's isHiddenDay applies
export function buildDaySeries(range: DateRange, hiddenDays: HiddenDays): DaySeries {
  let date: DateMarker = range.start
  let { end } = range
  let entries: DaySeriesEntry[] = []
  let dates: DateMarker[] = []
  let dayIndex = -1

  while (date < end) { // loop each day from start to end
    if (hiddenDays.isHidden(date)) {
      entries.push({
        kind: 'hidden',
        previousIndex: dayIndex,
        nextIndex: dayIndex + 1,
      })
    } else {
      dayIndex += 1
      entries.push({ kind: 'visible', index: dayIndex })
      dates.push(date)
    }
    date = addDays(date, 1)
  }

  let rangeStart = range.start
  let cnt = dates.length

  return {
    cnt,
    dates,
    sliceRange(sliceRange: DateRange): SlicedCoordRange | null {
      let firstResult = getDateIndex(rangeStart, entries, cnt, sliceRange.start)
      let lastResult = getDateIndex(rangeStart, entries, cnt, addDays(sliceRange.end, -1))
      let firstIndex = getFirstVisibleIndex(firstResult)
      let lastIndex = getLastVisibleIndex(lastResult)

      let clippedFirstIndex = Math.max(0, firstIndex)
      let clippedLastIndex = Math.min(cnt - 1, lastIndex)

      if (clippedFirstIndex <= clippedLastIndex) {
        return {
          start: clippedFirstIndex,
          end: clippedLastIndex + 1, // make exclusive
          isStart: firstResult.kind === 'visible' && firstIndex === clippedFirstIndex,
          isEnd: lastResult.kind === 'visible' && lastIndex === clippedLastIndex,
        }
      }

      return null
    },
  }
}

function getDateIndex(
  rangeStart: DateMarker,
  entries: DaySeriesEntry[],
  cnt: number,
  date: DateMarker,
): DayIndexResult {
  let dayOffset = Math.floor(diffDays(rangeStart, date))

  if (dayOffset < 0) {
    return { kind: 'before', index: -1 }
  }

  if (dayOffset >= entries.length) {
    return { kind: 'after', index: cnt }
  }

  return entries[dayOffset]
}

function getFirstVisibleIndex(result: DayIndexResult): number {
  return result.kind === 'hidden' ? result.nextIndex : result.index
}

function getLastVisibleIndex(result: DayIndexResult): number {
  return result.kind === 'hidden' ? result.previousIndex : result.index
}
