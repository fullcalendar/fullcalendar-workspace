import {
  SegEntry,
  SegGroup,
  DateMarker,
  DateProfile,
} from '@fullcalendar/core/internal'
import { TimeColsSeg } from './TimeColsSeg.js'
import { SegWebRect, buildWebPositioning } from './seg-web.js'
import { computeDateTopFrac } from './new/util.js'

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
): { [instanceId: string]: TimeGridSegVertical } {
  const res: { [instanceId: string]: TimeGridSegVertical } = {}

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

    res[seg.eventRange.instance.instanceId] = {
      start: startFrac,
      end: startFrac + heightFrac,
      size: heightFrac,
      isShort,
    }
  }

  return res
}

// HORIZONTAL
// -------------------------------------------------------------------------------------------------

export function computeFgSegHorizontals(
  segs: TimeColsSeg[],
  segVerticals: { [instanceId: string]: TimeGridSegVertical },
  eventOrderStrict?: boolean,
  eventMaxStack?: number,
): [
  segRects: { [instanceId: string]: SegWebRect },
  hiddenGroups: SegGroup[],
] {
  const segEntries: SegEntry[] = segs.map((seg, index) => ({
    index,
    thickness: 1,
    span: segVerticals[seg.eventRange.instance.instanceId],
  }))

  const [segRectArray, hiddenGroups] = buildWebPositioning(segEntries, eventOrderStrict, eventMaxStack)
  const segRects: { [instanceId: string]: SegWebRect } = {}

  for (const segRect of segRectArray) {
    const seg = segs[segRect.index]
    segRects[seg.eventRange.instance.instanceId] = segRect
  }

  return [segRects, hiddenGroups]
}
