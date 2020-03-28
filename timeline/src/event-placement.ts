import TimelineCoords from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'
import { sortEventSegs } from '@fullcalendar/core'


export function computeSegHorizontals(segs: TimelineLaneSeg[], timelineCoords?: TimelineCoords) {
  let horizontals: { [instanceId: string]: { left: number, right: number } } = {}

  if (timelineCoords) {
    for (let seg of segs) {
      let instanceId = seg.eventRange.instance.instanceId
      horizontals[instanceId] = timelineCoords.rangeToCoords(seg) // seg has { start, end }
    }
  }

  return horizontals
}


export interface TimelineSegDims { // the natural dimensions queried from the DOM
  left: number
  right: number
  height: number
}

interface Placement {
  key: string
  dims: TimelineSegDims
  top: number
}


export function computeSegVerticals(segs: TimelineLaneSeg[], eventOrderSpecs, dimHash: { [key: string]: TimelineSegDims } | null) {
  let placements: Placement[] = [] // sorted by top
  let maxBottom = 0

  if (dimHash) { // protection for if dims not computed yet
    segs = sortEventSegs(segs, eventOrderSpecs) as TimelineLaneSeg[]

    for (let seg of segs) {
      let key = seg.eventRange.instance.instanceId
      let dims = dimHash[key]

      if (dims) { // MORE protection
        let top = 0
        let insertI = 0 // where to start searching for an insert position

        for (let i = 0; i < placements.length; i++) { // loop through existing placements
          let placement = placements[i]

          if (testCollide(dims, top, placement.dims, placement.top)) {
            top = placement.top + dims.height
            insertI = i
          }
        }

        // move insertI along to be after the placement whos top is below the current top
        while (insertI < placements.length && top >= placements[insertI].top) {
          insertI++
        }

        placements.splice(insertI, 0, { key, dims, top }) // insert
        maxBottom = Math.max(maxBottom, top + dims.height)
      }
    }
  }

  let topHash: { [key: string]: number } = {}

  for (let placement of placements) {
    topHash[placement.key] = placement.top
  }

  return { segTops: topHash, height: maxBottom }
}


function testCollide(dims0: TimelineSegDims, top0: number, dims1: TimelineSegDims, top1: number) { // TODO: use geom utils?
  return dims0.right > dims1.left &&
    dims0.left < dims1.right &&
    top0 + dims0.height > top1 &&
    top0 < top1 + dims1.height
}
