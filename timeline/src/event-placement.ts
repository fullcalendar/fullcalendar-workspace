import { SegInput, SegHierarchy } from '@fullcalendar/common'
import { TimelineCoords } from './TimelineCoords'
import { TimelineLaneSeg } from './TimelineLaneSlicer'

export interface TimelineSegPlacement {
  seg: TimelineLaneSeg
  isVisible: boolean
  left: number
  right: number
  top: number
}

export function computeFgSegPlacements(
  segs: TimelineLaneSeg[],
  timelineCoords: TimelineCoords | null,
  eventInstanceHeights: { [instanceId: string]: number },
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
        segInputs.push({ index: i, spanStart: left, spanEnd: right, thickness: height })
      } else {
        crudePlacements.push({ seg, isVisible: false, left, right, top: 0 })
      }
    }
  }

  let hierarchy = new SegHierarchy()
  let hiddenEntries = hierarchy.addSegs(segInputs)
  let hiddenPlacements = hiddenEntries.map((entry) => ({
    seg: segs[entry.segInput.index],
    isVisible: false,
    left: entry.spanStart,
    right: entry.spanEnd,
    top: 0,
  } as TimelineSegPlacement))

  let visibleRects = hierarchy.toRects()
  let visiblePlacements: TimelineSegPlacement[] = []
  let maxHeight = 0

  for (let rect of visibleRects) {
    visiblePlacements.push({
      seg: segs[rect.segInput.index],
      isVisible: true,
      left: rect.spanStart,
      right: rect.spanEnd,
      top: rect.levelCoord,
    })
    maxHeight = Math.max(maxHeight, rect.levelCoord + rect.levelCoord)
  }

  return [
    visiblePlacements.concat(crudePlacements, hiddenPlacements),
    maxHeight,
  ]
}
