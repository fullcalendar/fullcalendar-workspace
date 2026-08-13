import { DayGridRange } from './DayTableModel'
import { EventRangeProps, getEventKey } from '../component-util/event-rendering'
import { SlicedCoordRange } from '../coord-range'
import { EventSegUiInteractionState } from '../component/DateComponent'

// TODO: use these types elsewhere

export type DayRowRange = SlicedCoordRange

export type DayRowEventRange = DayRowRange & EventRangeProps

export type DayRowEventRangePart = DayRowEventRange & {
  isSlice?: boolean
}

/*
We need really specific keys because RefMap::createRef() which is then given to heightRef
is unable to change key! As a result, we cannot reuse elements between a source's permanent
wrapper and its supplemental slices, but that's okay since they render quite differently
*/
export function getEventPartKey(seg: DayRowEventRangePart): string {
  return getEventKey(seg) + ':' + seg.start + (seg.isSlice ? ':slice' : '')
}

// DayGridRange utils (TODO: move)
// -------------------------------------------------------------------------------------------------

export function splitSegsByRow<S extends DayGridRange>(segs: S[], rowCount: number): S[][] {
  const byRow: S[][] = []

  for (let row = 0; row < rowCount; row++) {
    byRow[row] = []
  }

  for (const seg of segs) {
    byRow[seg.row].push(seg)
  }

  return byRow
}

export function splitInteractionByRow(
  ui: EventSegUiInteractionState<DayGridRange> | null,
  rowCount: number,
): EventSegUiInteractionState<DayGridRange>[] {
  const byRow: EventSegUiInteractionState<DayGridRange>[] = []

  if (!ui) {
    for (let row = 0; row < rowCount; row++) {
      byRow[row] = null
    }
  } else {
    for (let row = 0; row < rowCount; row++) {
      byRow[row] = {
        affectedInstances: ui.affectedInstances,
        isEvent: ui.isEvent,
        segs: [],
      }
    }

    for (const seg of ui.segs) {
      byRow[seg.row].segs.push(seg)
    }
  }

  return byRow
}
