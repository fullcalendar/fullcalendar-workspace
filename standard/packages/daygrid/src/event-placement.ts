import { EventRenderRange } from '@fullcalendar/core'
import { DayTableCell, SegHierarchy } from '@fullcalendar/core/internal'
import { DayRowEventRange, DayRowEventRangePart, getEventPartKey, sliceStandin } from './TableSeg.js'

export function computeFgSegVerticals(
  segs: DayRowEventRange[],
  segHeightMap: Map<string, number>,
  cells: DayTableCell[],
  maxHeight: number | undefined,
  strictOrder: boolean,
  dayMaxEvents: boolean | number,
  dayMaxEventRows: boolean | number,
): [
  segsByCol: DayRowEventRangePart[][],
  hiddenSegsByCol: DayRowEventRange[][],
  renderableSegsByCol: DayRowEventRangePart[][],
  segTops: Map<string, number>,
  heightsByCol: number[],
] {
  let maxCoord: number | undefined
  let maxDepth: number | undefined
  let hiddenConsumes: boolean

  if (dayMaxEvents === true || dayMaxEventRows === true) {
    maxCoord = maxHeight
    hiddenConsumes = true
  } else if (typeof dayMaxEvents === 'number') {
    maxDepth = dayMaxEvents
    hiddenConsumes = false
  } else if (typeof dayMaxEventRows === 'number') {
    maxDepth = dayMaxEventRows
    hiddenConsumes = true
  }

  const slicedSegMap = new Map<EventRenderRange, DayRowEventRangePart[]>()
  const hiddenSegMap = new Map<EventRenderRange, DayRowEventRange[]>()
  const segTops = new Map<string, number>()

  let hierarchy = new SegHierarchy<DayRowEventRange>(
    segs,
    (seg) => segHeightMap.get(getEventPartKey(seg)),
    strictOrder,
    maxCoord,
    maxDepth,
    hiddenConsumes,
    true, // allowSplitting (will use origin-seg heights, not lookup height)
  )
  hierarchy.traverseSegs((seg, segTop) => {
    if (seg.isSlice) {
      addToSegMap(slicedSegMap, seg)
    } else {
      segTops.set(getEventPartKey(seg), segTop)
    }
  })
  for (const hiddenSeg of hierarchy.hiddenSegs) {
    addToSegMap(hiddenSegMap, hiddenSeg) // hidden main segs
  }

  // recompute tops while considering slices
  if (slicedSegMap.size) {
    segTops.clear()
    hierarchy = new SegHierarchy<DayRowEventRange>(
      compileVisibleSegs(segs, slicedSegMap),
      (seg) => segHeightMap.get(getEventPartKey(seg)),
      strictOrder,
      maxCoord,
      maxDepth,
      hiddenConsumes,
      // allowSplitting = false
    )
    hierarchy.traverseSegs((seg, segTop) => {
      segTops.set(getEventPartKey(seg), segTop) // newly-hidden main segs and slices
    })
    for (const hiddenSeg of hierarchy.hiddenSegs) {
      addToSegMap(hiddenSegMap, hiddenSeg)
    }
  }

  const segsByCol: DayRowEventRangePart[][] = []
  const hiddenSegsByCol: DayRowEventRange[][] = []
  const renderableSegsByCol: DayRowEventRangePart[][] = []
  const heightsByCol: number[] = []

  for (let col = 0; col < cells.length; col++) {
    segsByCol.push([])
    hiddenSegsByCol.push([])
    renderableSegsByCol.push([])
    heightsByCol.push(0)
  }

  for (const seg of segs) {
    const { eventRange } = seg
    const slicedSegs = slicedSegMap.get(eventRange)
    const hiddenSegs = hiddenSegMap.get(eventRange) || []
    const visibleSegs = slicedSegs || [seg]

    if (slicedSegs) {
      // when there are slices, the original seg must still be rendered for dimension querying
      renderableSegsByCol[seg.start].push(seg)
    }

    for (const hiddenSeg of hiddenSegs) {
      for (let col = hiddenSeg.start; col < hiddenSeg.end; col++) {
        const standin = sliceStandin(hiddenSeg, col)
        hiddenSegsByCol[col].push(standin)

        // when there are slices, the hiddenSegs contribute to the standin coverage
        if (slicedSegs) {
          segsByCol[col].push(standin)
          renderableSegsByCol[col].push(col === hiddenSeg.start ? hiddenSeg : standin)
        }
      }
    }

    for (const visibleSeg of visibleSegs) {
      for (let col = visibleSeg.start; col < visibleSeg.end; col++) {
        const standin = sliceStandin(visibleSeg, col)
        segsByCol[col].push(standin)
        renderableSegsByCol[col].push(col === visibleSeg.start ? visibleSeg : standin)
      }

      const segKey = getEventPartKey(visibleSeg)
      const segTop = segTops.get(segKey)

      if (segTop != null) {
        const segHeight = segHeightMap.get(segKey)

        for (let col = seg.start; col < seg.end; col++) {
          heightsByCol[col] = Math.max(heightsByCol[col], segTop + segHeight)
        }
      }
    }
  }

  return [
    segsByCol,
    hiddenSegsByCol,
    renderableSegsByCol,
    segTops,
    heightsByCol,
  ]
}

// Utils
// -------------------------------------------------------------------------------------------------

function addToSegMap(map: Map<EventRenderRange, DayRowEventRange[]>, seg: DayRowEventRange): void {
  let list = map.get(seg.eventRange)
  if (!list) {
    map.set(seg.eventRange, list = [])
  }
  list.push(seg)
}

function compileVisibleSegs(
  segs: DayRowEventRange[],
  slicedSegMap: Map<EventRenderRange, DayRowEventRange[]>,
): DayRowEventRange[] {
  const res: DayRowEventRange[] = []

  for (const seg of segs) {
    const slicedSegs = slicedSegMap.get(seg.eventRange)

    if (slicedSegs) {
      for (let i = 0; i < slicedSegs.length; i++) {
        res.push(slicedSegs[i])
      }
    } else {
      res.push(seg)
    }
  }

  return res
}
