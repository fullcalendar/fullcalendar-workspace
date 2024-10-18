import {
  SegHierarchy, groupIntersectingSegs,
  DateEnv,
  SegGroup,
  EventRangeProps,
  CoordSpan,
  getEventKey,
} from '@fullcalendar/core/internal'
import { TimelineCoordRange, TimelineRange } from './TimelineLaneSlicer.js'
import { TimelineDateProfile } from './timeline-date-profile.js'
import { dateToCoord } from './timeline-positioning.js'

export function computeManySegHorizontals(
  segs: (TimelineRange & EventRangeProps)[],
  segMinWidth: number | undefined,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): { [instanceId: string]: CoordSpan } {
  const res: { [instanceId: string]: CoordSpan } = {}

  for (const seg of segs) {
    res[getEventKey(seg)] = computeSegHorizontals(
      seg,
      segMinWidth,
      dateEnv,
      tDateProfile,
      slotWidth
    )
  }

  return res
}

export function computeSegHorizontals(
  seg: TimelineRange,
  segMinWidth: number | undefined,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): CoordSpan {
  const startCoord = dateToCoord(seg.startDate, dateEnv, tDateProfile, slotWidth)
  const endCoord = dateToCoord(seg.endDate, dateEnv, tDateProfile, slotWidth)
  let size = endCoord - startCoord

  if (segMinWidth) {
    size = Math.max(size, segMinWidth)
  }

  return { start: startCoord, size }
}

export function computeFgSegPlacements( // mostly horizontals
  segs: (TimelineRange & EventRangeProps)[],
  segHorizontals: { [instanceId: string]: CoordSpan }, // TODO: use Map
  segHeights: Map<string, number>, // keyed by instanceId
  hiddenGroupHeights: Map<string, number>,
  strictOrder?: boolean,
  maxStackDepth?: number,
): [
  segTops: Map<string, number>,
  hiddenGroups: SegGroup<TimelineCoordRange>[],
  hiddenGroupTops: Map<string, number>,
  totalHeight: number,
] {
  let hierarchy = new SegHierarchy<TimelineCoordRange>((instanceId) => {
    return segHeights.get(instanceId)
  })
  if (strictOrder != null) {
    hierarchy.strictOrder = strictOrder
  }
  if (maxStackDepth != null) {
    hierarchy.maxDepth = maxStackDepth
  }

  const [segPlacements, segTops, hiddenSegs] = hierarchy.insertSegs(segs.map((seg) => {
    const hcoords = segHorizontals[getEventKey(seg)]

    return {
      ...seg,
      start: hcoords.start,
      end: hcoords.start + hcoords.size,
    }
  }))

  let totalHeight = 0

  for (const segPlacement of segPlacements) {
    totalHeight = Math.max(totalHeight, segTops.get(segPlacement.key) + segPlacement.thickness)
  }

  const hiddenGroups = groupIntersectingSegs(hiddenSegs)
  const hiddenGroupTops = new Map<string, number>()

  for (const hiddenGroup of hiddenGroups) {
    const { levelCoord: top } = hierarchy.findInsertion(hiddenGroup, 0)
    const hiddenGroupHeight = hiddenGroupHeights.get(hiddenGroup.key) || 0

    hiddenGroupTops.set(hiddenGroup.key, top)
    totalHeight = Math.max(totalHeight, top + hiddenGroupHeight)
  }

  return [
    segTops,
    hiddenGroups,
    hiddenGroupTops,
    totalHeight,
  ]
}
