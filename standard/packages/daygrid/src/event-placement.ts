import {
  SegHierarchy,
  SegEntry,
  SegInsertion,
  buildEntryKey,
  intersectSpans,
  DayTableCell,
} from '@fullcalendar/core/internal'
import { TableSeg } from './TableSeg.js'

/*
Unique per-START-column, good for cataloging by top
*/
export function getSegStartId(seg: TableSeg): string {
  return seg.eventRange.instance.instanceId + ':' + seg.firstCol
}

/*
Unique per-START-and-END-column, good for cataloging by width/height
*/
export function getSegSpanId(seg: TableSeg): string {
  return getSegStartId(seg) + ':' + seg.lastCol
}

export function computeFgSegVerticals(
  segs: TableSeg[],
  segHeightMap: Map<string, number>, // keyed by segSpanId
  cells: DayTableCell[],
  topOrigin: number | undefined,
  maxHeight: number | undefined,
  strictOrder: boolean,
  dayMaxEvents: boolean | number,
  dayMaxEventRows: boolean | number,
): [
  hiddenSegsByCol: TableSeg[][],
  segTops: { [segStartId: string]: number },
  heightsByCol: number[],
] {
  // initialize column-based arrays

  const colCnt = cells.length
  const hiddenSegsByCol: TableSeg[][] = []
  const heightsByCol: number[] = []

  for (let col = 0; col < colCnt; col++) {
    hiddenSegsByCol.push([])
    heightsByCol.push(0)
  }

  // for segs that have heights, create entries to be given to DayGridSegHierarchy
  // otherwise, record seg as hidden

  const segEntries: SegEntry[] = segs.map((seg, index) => ({
    index: index,
    span: {
      start: seg.firstCol,
      end: seg.lastCol + 1,
    },
  }))

  // configure hierarchy position-generator

  let hierarchy = new DayGridSegHierarchy((segEntry: SegEntry) => (
    segHeightMap.get(getSegSpanId(segs[segEntry.index]))
  ))
  hierarchy.allowReslicing = true
  hierarchy.strictOrder = strictOrder

  if (dayMaxEvents === true || dayMaxEventRows === true) {
    hierarchy.maxCoord = maxHeight
    hierarchy.hiddenConsumes = true
  } else if (typeof dayMaxEvents === 'number') {
    hierarchy.maxStackCnt = dayMaxEvents
  } else if (typeof dayMaxEventRows === 'number') {
    hierarchy.maxStackCnt = dayMaxEventRows
    hierarchy.hiddenConsumes = true
  }

  // compile segTops & heightsByCol

  const hiddenSegEntries = hierarchy.addSegs(segEntries)
  const segRects = hierarchy.toRects()
  const segTops: { [segStartId: string]: number } = {}

  for (const segRect of segRects) {
    const seg = segs[segRect.index]
    segTops[getSegStartId(seg)] = topOrigin + segRect.levelCoord

    let { start: col, end: endCol } = segRect.span
    for (; col < endCol; col++) {
      heightsByCol[col] = Math.max(
        heightsByCol[col],
        segRect.levelCoord + segRect.thickness, // bottom
      )
    }
  }

  // compile # of invisible segs per-column

  for (const hiddenSegEntry of hiddenSegEntries) {
    const { span } = hiddenSegEntry
    const hiddenSeg = segs[hiddenSegEntry.index]

    for (let col = span.start; col < span.end; col++) {
      hiddenSegsByCol[col].push(hiddenSeg)
    }
  }

  return [hiddenSegsByCol, segTops, heightsByCol]
}

// DayGridSegHierarchy
// -------------------------------------------------------------------------------------------------

class DayGridSegHierarchy extends SegHierarchy {
  // config
  hiddenConsumes: boolean = false

  // allows us to keep hidden entries in the hierarchy so they take up space
  forceHidden: { [entryId: string]: true } = {}

  addSegs(segInputs: SegEntry[]): SegEntry[] {
    const hiddenSegs = super.addSegs(segInputs)
    const { entriesByLevel } = this
    const excludeHidden = (entry: SegEntry) => !this.forceHidden[buildEntryKey(entry)]

    // remove the forced-hidden segs
    for (let level = 0; level < entriesByLevel.length; level += 1) {
      entriesByLevel[level] = entriesByLevel[level].filter(excludeHidden)
    }

    return hiddenSegs
  }

  handleInvalidInsertion(insertion: SegInsertion, entry: SegEntry, hiddenEntries: SegEntry[]) {
    const { entriesByLevel, forceHidden } = this
    const { touchingEntry, touchingLevel, touchingLateral } = insertion

    // the entry that the new insertion is touching must be hidden
    if (this.hiddenConsumes && touchingEntry) {
      const touchingEntryId = buildEntryKey(touchingEntry)

      if (!forceHidden[touchingEntryId]) {
        if (this.allowReslicing) {
          // split up the touchingEntry, reinsert it
          const hiddenEntry = {
            ...touchingEntry,
            span: intersectSpans(touchingEntry.span, entry.span), // hit the `entry` barrier
          }

          // reinsert the area that turned into a "more" link (so no other entries try to
          // occupy the space) but mark it forced-hidden
          const hiddenEntryId = buildEntryKey(hiddenEntry)
          forceHidden[hiddenEntryId] = true
          entriesByLevel[touchingLevel][touchingLateral] = hiddenEntry

          hiddenEntries.push(hiddenEntry)
          this.splitEntry(touchingEntry, entry, hiddenEntries)
        } else {
          forceHidden[touchingEntryId] = true
          hiddenEntries.push(touchingEntry)
        }
      }
    }

    // will try to reslice...
    super.handleInvalidInsertion(insertion, entry, hiddenEntries)
  }
}
