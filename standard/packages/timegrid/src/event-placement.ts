import {
  SegEntry,
  SegGroup,
  DateMarker,
  DateProfile,
} from '@fullcalendar/core/internal'
import { TimeColsSeg } from './TimeColsSeg.js'
import { SegWebRect, buildWebPositioning } from './seg-web.js'
import { computeDateTopFrac } from './components/util.js'

// VERTICAL
// -------------------------------------------------------------------------------------------------

export interface TimeGridSegVertical {
  start: number // frac
  end: number // frac
  size: number // frac
  isShort: boolean
}

export function computeFgSegVerticals(
  segs: TimeColsSeg[],
  dateProfile: DateProfile,
  colDate: DateMarker,
  slatCnt: number,
  slatHeight: number | undefined, // in pixels
  eventMinHeight: number | undefined, // in pixels
  eventShortHeight?: number, // in pixels
): TimeGridSegVertical[] {
  const res: TimeGridSegVertical[] = []

  for (const seg of segs) {
    const startFrac = computeDateTopFrac(seg.start, dateProfile, colDate)
    const endFrac = computeDateTopFrac(seg.end, dateProfile, colDate)
    let heightFrac = endFrac - startFrac
    let isShort = false

    if (slatHeight !== undefined) {
      const totalHeight = slatHeight * slatCnt
      let heightPixels = heightFrac * totalHeight

      if (eventMinHeight != null && heightPixels < eventMinHeight) {
        heightPixels = eventMinHeight
        heightFrac = heightPixels / totalHeight
      }

      isShort = eventShortHeight != null && heightPixels < eventShortHeight
    }

    res.push({
      start: startFrac,
      end: startFrac + heightFrac,
      size: heightFrac,
      isShort,
    })
  }

  return res
}

// HORIZONTAL
// -------------------------------------------------------------------------------------------------

export function computeFgSegHorizontals(
  segs: TimeColsSeg[],
  segVerticals: TimeGridSegVertical[],
  eventOrderStrict?: boolean,
  eventMaxStack?: number,
): [
  segRects: SegWebRect[],
  hiddenGroups: SegGroup[],
] {
  const segEntries: SegEntry[] = segs.map((seg, index) => ({
    index,
    seg,
    thickness: 1,
    span: segVerticals[index],
  }))

  const [segRectsUnordered, hiddenGroups] = buildWebPositioning(segEntries, eventOrderStrict, eventMaxStack)
  const segRects: SegWebRect[] = []

  for (const segRect of segRectsUnordered) {
    segRects[segRect.index] = segRect
  }

  return [segRects, hiddenGroups]
}
