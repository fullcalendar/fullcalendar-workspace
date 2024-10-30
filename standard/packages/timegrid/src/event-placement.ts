import {
  DateMarker,
  DateProfile,
} from '@fullcalendar/core/internal'
import { TimeGridRange } from './TimeColsSeg.js'
import { computeDateTopFrac } from './components/util.js'

// VERTICAL
// -------------------------------------------------------------------------------------------------

export interface TimeGridSegVertical {
  start: number // pixels
  end: number // pixels
  size: number // pixels
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

  if (slatHeight != null) {
    const totalHeight = slatHeight * slatCnt

    for (const seg of segs) {
      const startFrac = computeDateTopFrac(seg.startDate, dateProfile, colDate)
      const endFrac = computeDateTopFrac(seg.endDate, dateProfile, colDate)
      const startCoord = startFrac * totalHeight
      let endCoord = endFrac * totalHeight
      let height = endCoord - startCoord

      if (eventMinHeight != null && height < eventMinHeight) {
        height = eventMinHeight
        endCoord = startCoord + height
      }

      res.push({
        start: startCoord,
        end: endCoord,
        size: height,
        isShort: eventShortHeight != null && height < eventShortHeight
      })
    }
  }

  return res
}
