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
The unconditional start index is essential source-seg identity: one event
instance can produce multiple whole view-coordinate segs with different starts,
especially in Resource DayGrid. A partial gets its own suffix because a
permanent source wrapper and its supplemental slice cannot share RefMap refs.
The end is deliberately excluded so narrowing or widening a slice preserves its
DOM node and ResizeObserver; the existing pre-paint size flush corrects the
temporarily stale height during that intermediate commit.
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
