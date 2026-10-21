import { DateMarker, Duration, addMs, intersectRanges } from '@full-ui/headless-calendar'
import { DateProfile } from '../../DateProfileGenerator'
import { TimeGridRange } from '../../timegrid/TimeColsSeg'
import { computeActiveRange } from '../slicing-utils'
import { DayTableModel } from './model'
import { DayTableKeying, PLAIN_KEYING, TIME_GRID_TIMED_LANE } from './keying'
import { sliceRangeToCoords } from './slice-ranges'

/*
The now indicator's segs in a TimeGrid's view columns. A 1ms span at `nowDate`, first clipped to
the active range (the civil one when there's a nextDayThreshold, as the views pass one), then cut
by the slot-widened date columns, then put into every view column of its date (keyed and
placeholder). The segs carry no event range.

Non-plain models dot only the first column of a date, unless resources are above several dates
(each resource's line is separate then)
*/
export function sliceDayTableNowIndicator(
  nowDate: DateMarker,
  model: DayTableModel,
  keying: DayTableKeying,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  datesAboveResources: boolean,
): TimeGridRange[] {
  let activeRange = computeActiveRange(dateProfile, Boolean(nextDayThreshold))
  let range = intersectRanges({ start: nowDate, end: addMs(nowDate, 1) }, activeRange) // 1ms, protect against null range

  if (!range) {
    return []
  }

  let dateSegs = sliceRangeToCoords(range, model.daySeries, model.dayCols, TIME_GRID_TIMED_LANE) as TimeGridRange[]

  if (keying === PLAIN_KEYING) {
    return dateSegs
  }

  let alwaysShowDot = !datesAboveResources && model.dayCols.length > 1
  let segs: TimeGridRange[] = []

  for (let dateSeg of dateSegs) {
    for (let colI = 0; colI < model.colCount; colI += 1) {
      if (model.cols[colI].dateI === dateSeg.col) {
        segs.push({
          ...dateSeg,
          col: colI,
          showDot: alwaysShowDot || model.dateFirstCols[dateSeg.col] === colI,
        })
      }
    }
  }

  return segs
}
