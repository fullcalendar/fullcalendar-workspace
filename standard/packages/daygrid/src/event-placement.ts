import {
  DayTableCell,
  SegHierarchy,
  EventPlacement,
  SlicedCoordRange,
  EventRangeProps,
} from '@fullcalendar/core/internal'

export function computeFgSegVerticals(
  segs: (SlicedCoordRange & EventRangeProps)[],
  segHeightMap: Map<string, number>, // keyed by seg.key
  cells: DayTableCell[],
  maxHeight: number | undefined,
  strictOrder: boolean,
  dayMaxEvents: boolean | number,
  dayMaxEventRows: boolean | number,
): [
  segPlacements: EventPlacement<SlicedCoordRange & EventRangeProps>[],
  segTops: Map<string, number>,
  heightsByCol: number[],
  hiddenSegs: (SlicedCoordRange & EventRangeProps)[],
] {
  const colCnt = cells.length
  const heightsByCol: number[] = []

  for (let col = 0; col < colCnt; col++) {
    heightsByCol.push(0)
  }

  const hierarchy = new SegHierarchy((segKey) => (
    segHeightMap.get(segKey)
  ))
  hierarchy.allowFragments = true
  hierarchy.strictOrder = strictOrder

  if (dayMaxEvents === true || dayMaxEventRows === true) {
    hierarchy.maxCoord = maxHeight
    hierarchy.hiddenConsumes = true
  } else if (typeof dayMaxEvents === 'number') {
    hierarchy.maxDepth = dayMaxEvents
  } else if (typeof dayMaxEventRows === 'number') {
    hierarchy.maxDepth = dayMaxEventRows
    hierarchy.hiddenConsumes = true
  }

  const [segPlacements, segTops, hiddenSegs] = hierarchy.insertSegs(segs)

  for (const segPlacement of segPlacements) {
    for (let col = segPlacement.start; col < segPlacement.end; col++) {
      const segTop = segTops.get(segPlacement.key)
      if (segTop != null) {
        heightsByCol[col] = Math.max(
          heightsByCol[col],
          segTop + segPlacement.thickness, // bottom
        )
      }
    }
  }

  return [segPlacements, segTops, heightsByCol, hiddenSegs]
}
