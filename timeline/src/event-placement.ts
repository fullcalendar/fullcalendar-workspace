import {
  SegInput, SegHierarchy, groupIntersectingEntries, SegEntry, buildIsoString,
  computeEarliestSegStart,
} from '@fullcalendar/common'
import { TimelineCoords } from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

export interface TimelineSegHCoords {
  spanStart: number
  spanEnd: number
}

export interface TimelineSegPlacement {
  seg: TimelineLaneSeg | TimelineLaneSeg[] // HACK: if array, then it's a more-link group
  hcoords: TimelineSegHCoords | null
  top: number | null
}

export function computeSegHCoords(
  segs: TimelineLaneSeg[],
  minWidth: number,
  timelineCoords: TimelineCoords | null
): TimelineSegHCoords[] {
  let hcoords: TimelineSegHCoords[] = []

  if (timelineCoords) {
    for (let seg of segs) {
      let res = timelineCoords.rangeToCoords(seg)
      let spanStart = Math.round(res.spanStart) // for barely-overlapping collisions
      let spanEnd = Math.round(res.spanEnd) //

      if (spanEnd - spanStart < minWidth) {
        spanEnd = spanStart + minWidth
      }

      hcoords.push({ spanStart, spanEnd })
    }
  }

  return hcoords
}

export function computeFgSegPlacements(
  segs: TimelineLaneSeg[],
  segHCoords: TimelineSegHCoords[], // might not have for every seg
  eventInstanceHeights: { [instanceId: string]: number }, // might not have for every seg
  moreLinkHeights: { [isoStr: string]: number }, // might not have for every more-link
  strictOrder?: boolean,
  maxStackCnt?: number,
): [TimelineSegPlacement[], number] { // [placements, totalHeight]
  let segInputs: SegInput[] = []
  let crudePlacements: TimelineSegPlacement[] = [] // when we don't know dims

  for (let i = 0; i < segs.length; i++) {
    let seg = segs[i]
    let instanceId = seg.eventRange.instance.instanceId
    let height = eventInstanceHeights[instanceId]
    let hcoords = segHCoords[i]

    if (height && hcoords) {
      segInputs.push({
        index: i,
        ...hcoords,
        thickness: height,
      })
    } else {
      crudePlacements.push({
        seg,
        hcoords: null,
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
    seg: segs[entry.segInput.index],
    isVisible: false,
    hcoords: entry,
    top: 0,
  } as TimelineSegPlacement))

  let hiddenGroups = groupIntersectingEntries(hiddenEntries)
  let moreLinkInputs: SegInput[] = []
  let moreLinkCrudePlacements: TimelineSegPlacement[] = []
  const extractSeg = (entry: SegEntry) => segs[entry.segInput.index]

  for (let i = 0; i < hiddenGroups.length; i += 1) {
    let hiddenGroup = hiddenGroups[i]
    let sortedSegs = hiddenGroup.entries.map(extractSeg)
    let height = moreLinkHeights[buildIsoString(computeEarliestSegStart(sortedSegs))] // not optimal :(

    if (height != null) {
      // NOTE: the hiddenGroup's spanStart/spanEnd are already computed by rangeToCoords. computed during input.
      moreLinkInputs.push({
        index: segs.length + i, // out-of-bounds indexes map to hiddenGroups
        spanStart: hiddenGroup.spanStart,
        spanEnd: hiddenGroup.spanEnd,
        thickness: height,
      })
    } else {
      moreLinkCrudePlacements.push({
        seg: sortedSegs, // a Seg array signals a more-link
        hcoords: hiddenGroup,
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
    let segIndex = rect.segInput.index
    visiblePlacements.push({
      seg: segIndex < segs.length
        ? segs[segIndex] // a real seg
        : hiddenGroups[segIndex - segs.length].entries.map(extractSeg), // signals a more-link
      hcoords: rect,
      top: rect.levelCoord,
    })
    maxHeight = Math.max(maxHeight, rect.levelCoord + rect.thickness)
  }

  return [
    visiblePlacements.concat(crudePlacements, hiddenPlacements, moreLinkCrudePlacements),
    maxHeight,
  ]
}
