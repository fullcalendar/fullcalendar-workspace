import { SegInput, SegHierarchy, groupIntersectingEntries, SegEntry } from '@fullcalendar/common'
import { TimelineCoords } from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

export interface TimelineSegPlacement {
  seg: TimelineLaneSeg | TimelineLaneSeg[] // HACK: if array, then it's a more-link group
  isVisible: boolean
  left: number
  right: number
  top: number
}

export function computeFgSegPlacements(
  segs: TimelineLaneSeg[],
  timelineCoords: TimelineCoords | null,
  eventInstanceHeights: { [instanceId: string]: number },
  moreLinkHeights: { [segPlacementLeft: string]: number },
  maxStackCnt?: number,
): [TimelineSegPlacement[], number] { // [placements, totalHeight]
  let segInputs: SegInput[] = []
  let crudePlacements: TimelineSegPlacement[] = [] // when we don't know height

  if (timelineCoords) {
    for (let i = 0; i < segs.length; i += 1) {
      let seg = segs[i]
      let instanceId = seg.eventRange.instance.instanceId
      let height = eventInstanceHeights[instanceId]
      let horizontalCoords = timelineCoords.rangeToCoords(seg)
      let left = Math.round(horizontalCoords.left) // for barely-overlapping collisions
      let right = Math.round(horizontalCoords.right) //

      if (height != null) {
        segInputs.push({
          index: i,
          spanStart: left,
          spanEnd: right,
          thickness: height,
        })
      } else {
        crudePlacements.push({
          seg,
          isVisible: false,
          left,
          right,
          top: 0,
        })
      }
    }
  }

  let hierarchy = new SegHierarchy()
  if (maxStackCnt != null) {
    hierarchy.maxStackCnt = maxStackCnt
  }

  let hiddenEntries = hierarchy.addSegs(segInputs)
  let hiddenPlacements = hiddenEntries.map((entry) => ({
    seg: segs[entry.segInput.index],
    isVisible: false,
    left: entry.spanStart,
    right: entry.spanEnd,
    top: 0,
  } as TimelineSegPlacement))

  let hiddenGroups = groupIntersectingEntries(hiddenEntries)
  let moreLinkInputs: SegInput[] = []
  let moreLinkCrudePlacements: TimelineSegPlacement[] = []
  const extractSeg = (entry: SegEntry) => segs[entry.segInput.index]

  for (let i = 0; i < hiddenGroups.length; i += 1) {
    let hiddenGroup = hiddenGroups[i]
    let height = moreLinkHeights[hiddenGroup.spanStart]

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
        seg: hiddenGroup.entries.map(extractSeg), // a Seg array signals a more-link
        isVisible: false,
        left: hiddenGroup.spanStart,
        right: hiddenGroup.spanEnd,
        top: 0,
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
      isVisible: true,
      left: rect.spanStart,
      right: rect.spanEnd,
      top: rect.levelCoord,
    })
    maxHeight = Math.max(maxHeight, rect.levelCoord + rect.thickness)
  }

  return [
    visiblePlacements.concat(crudePlacements, hiddenPlacements, moreLinkCrudePlacements),
    maxHeight,
  ]
}
