import {
  DateMarker,
  DateProfile,
} from '@fullcalendar/core/internal'
import { TimeGridRange } from './TimeColsSeg.js'
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
  segs: TimeGridRange[],
  dateProfile: DateProfile,
  colDate: DateMarker,
  slatCnt: number,
  slatHeight: number | undefined, // in pixels
  eventMinHeight: number | undefined, // in pixels
  eventShortHeight?: number, // in pixels
): TimeGridSegVertical[] {
  const res: TimeGridSegVertical[] = []

  for (const seg of segs) {
    const startFrac = computeDateTopFrac(seg.startDate, dateProfile, colDate)
    const endFrac = computeDateTopFrac(seg.endDate, dateProfile, colDate)
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
