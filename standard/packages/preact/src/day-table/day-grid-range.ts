import { DateMarker } from '@full-ui/headless-calendar'
import { Dictionary } from '../options/options'
import { SlicedCoordRange } from '../event-segs/coord-range'

export interface DayGridRange extends SlicedCoordRange {
  row: number
  // `start` is start-COLUMN
  // `end` is end-COLUMN
}

/*
TODO: DRY-up these types and utils with header-tier
*/
export interface DayTableCell {
  key: string // probably just the serialized date, but could be other metadata if this col is specific to another entity
  date: DateMarker
  isMajor: boolean
  isDisabled: boolean
  isInert?: boolean // structural cells that cannot be interaction targets
  renderProps?: Dictionary
  attrs?: Dictionary
  className?: string
  dateSpanProps?: Dictionary
}

export function buildDayGridRanges(
  seriesRange: SlicedCoordRange | null,
  daysPerRow: number,
): DayGridRange[] {
  let ranges: DayGridRange[] = []

  if (seriesRange) {
    const { start, end } = seriesRange
    let index = start

    while (index < end) {
      let row = Math.floor(index / daysPerRow)
      let nextIndex = Math.min((row + 1) * daysPerRow, end)

      ranges.push({
        row,
        start: index % daysPerRow,
        end: (nextIndex - 1) % daysPerRow + 1,
        isStart: seriesRange.isStart && index === start,
        isEnd: seriesRange.isEnd && nextIndex === end,
      })

      index = nextIndex
    }
  }

  return ranges
}
