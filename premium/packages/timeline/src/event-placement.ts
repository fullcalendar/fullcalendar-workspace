import {
  SegSpan, SegHierarchy, groupIntersectingEntries, SegEntry, buildIsoString,
  computeEarliestSegStart,
} from '@fullcalendar/common'
import { TimelineCoords } from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

export interface TimelineSegPlacement {
  seg: TimelineLaneSeg | TimelineLaneSeg[] // HACK: if array, then it's a more-link group
  hcoords: SegSpan | null
  top: number | null
}

export function computeSegHCoords(
  segs: TimelineLaneSeg[],
  minWidth: number,
  timelineCoords: TimelineCoords | null,
): SegSpan[] {
  let hcoords: SegSpan[] = []

  if (timelineCoords) {
    for (let seg of segs) {
      let res = timelineCoords.rangeToCoords(seg)
      let start = Math.round(res.start) // for barely-overlapping collisions
      let end = Math.round(res.end) //

      if (end - start < minWidth) {
        end = start + minWidth
      }

      hcoords.push({ start, end })
    }
  }

  return hcoords
}

export function computeFgSegPlacements(
  segs: TimelineLaneSeg[],
  segHCoords: SegSpan[], // might not have for every seg
  eventInstanceHeights: { [instanceId: string]: number }, // might not have for every seg
  moreLinkHeights: { [isoStr: string]: number }, // might not have for every more-link
  strictOrder?: boolean,
  maxStackCnt?: number,
): [TimelineSegPlacement[], number] { // [placements, totalHeight]
  let segInputs: SegEntry[] = []
  let crudePlacements: TimelineSegPlacement[] = [] // when we don't know dims

  for (let i = 0; i < segs.length; i += 1) {
    let seg = segs[i]
    let instanceId = seg.eventRange.instance.instanceId
    let height = eventInstanceHeights[instanceId]
    let hcoords = segHCoords[i]

    if (height && hcoords) {
      segInputs.push({
        index: i,
        span: hcoords,
        thickness: height,
      })
    } else {
      crudePlacements.push({
        seg,
        hcoords, // might as well set hcoords if we have them. might be null
        top: null,
      })
    }
  }

  let hierarchy = new SegHierarchy()
  if (strictOrder != null) {
    hierarchy.strictOrder = strictOrder
  }
  if (maxStackCnt != null) {
    hierarchy.maxStackCnt = maxStackCnt
  }

  let hiddenEntries = hierarchy.addSegs(segInputs)
  let hiddenPlacements = hiddenEntries.map((entry) => ({
    seg: segs[entry.index],
    hcoords: entry.span,
    top: null,
  } as TimelineSegPlacement))

  let hiddenGroups = groupIntersectingEntries(hiddenEntries)
  let moreLinkInputs: SegEntry[] = []
  let moreLinkCrudePlacements: TimelineSegPlacement[] = []
  const extractSeg = (entry: SegEntry) => segs[entry.index]

  for (let i = 0; i < hiddenGroups.length; i += 1) {
    let hiddenGroup = hiddenGroups[i]
    let sortedSegs = hiddenGroup.entries.map(extractSeg)
    let height = moreLinkHeights[buildIsoString(computeEarliestSegStart(sortedSegs))] // not optimal :(

    if (height != null) {
      // NOTE: the hiddenGroup's spanStart/spanEnd are already computed by rangeToCoords. computed during input.
      moreLinkInputs.push({
        index: segs.length + i, // out-of-bounds indexes map to hiddenGroups
        thickness: height,
        span: hiddenGroup.span,
      })
    } else {
      moreLinkCrudePlacements.push({
        seg: sortedSegs, // a Seg array signals a more-link
        hcoords: hiddenGroup.span,
        top: null,
      })
    }
  }

  // add more-links into the hierarchy, but don't limit
  hierarchy.maxStackCnt = -1
  hierarchy.addSegs(moreLinkInputs)

  let visibleRects = hierarchy.toRects()
  let visiblePlacements: TimelineSegPlacement[] = []
  let maxHeight = 0

  for (let rect of visibleRects) {
    let segIndex = rect.index
    visiblePlacements.push({
      seg: segIndex < segs.length
        ? segs[segIndex] // a real seg
        : hiddenGroups[segIndex - segs.length].entries.map(extractSeg), // signals a more-link
      hcoords: rect.span,
      top: rect.levelCoord,
    })
    maxHeight = Math.max(maxHeight, rect.levelCoord + rect.thickness)
  }

  return [
    visiblePlacements.concat(crudePlacements, hiddenPlacements, moreLinkCrudePlacements),
    maxHeight,
  ]
}
