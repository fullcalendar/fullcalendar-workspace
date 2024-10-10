import {
  SegHierarchy, groupIntersectingEntries, SegEntry,
  DateEnv,
  SegGroup,
} from '@fullcalendar/core/internal'
import { TimelineLaneSeg } from './TimelineLaneSlicer.js'
import { TimelineDateProfile } from './timeline-date-profile.js'
import { dateToCoord } from './timeline-positioning.js'

export interface TimelineSegHorizontals {
  start: number
  size: number
}

export function computeManySegHorizontals(
  segs: TimelineLaneSeg[],
  segMinWidth: number | undefined,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): { [instanceId: string]: TimelineSegHorizontals } {
  const res: { [instanceId: string]: TimelineSegHorizontals } = {}

  for (const seg of segs) {
    res[seg.eventRange.instance.instanceId] = computeSegHorizontals(
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
  seg: TimelineLaneSeg,
  segMinWidth: number | undefined,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): TimelineSegHorizontals {
  const startCoord = dateToCoord(seg.start, dateEnv, tDateProfile, slotWidth)
  const endCoord = dateToCoord(seg.end, dateEnv, tDateProfile, slotWidth)
  let size = endCoord - startCoord

  if (segMinWidth) {
    size = Math.max(size, segMinWidth)
  }

  return { start: startCoord, size }
}

export function computeFgSegPlacements( // mostly horizontals
  segs: TimelineLaneSeg[],
  segHorizontals: { [instanceId: string]: TimelineSegHorizontals },
  segHeights: Map<string, number>, // keyed by instanceId
  strictOrder?: boolean,
  maxStackDepth?: number,
): [
  segTops: { [instanceId: string]: number },
  segsBottom: number,
  hiddenGroups: SegGroup[],
  hiddenGroupTops: { [key: string]: number },
] {
  let segEntries: SegEntry[] = []

  for (let i = 0; i < segs.length; i += 1) {
    let seg = segs[i]
    let instanceId = seg.eventRange.instance.instanceId
    let height = segHeights.get(instanceId)
    let hcoords = segHorizontals[instanceId]

    if (height != null && hcoords != null) {
      segEntries.push({
        index: i,
        seg,
        span: {
          start: hcoords.start,
          end: hcoords.start + hcoords.size,
        },
        thickness: height,
      })
    }
  }

  let hierarchy = new SegHierarchy()
  if (strictOrder != null) {
    hierarchy.strictOrder = strictOrder
  }
  if (maxStackDepth != null) {
    hierarchy.maxStackDepth = maxStackDepth
  }

  let hiddenEntries = hierarchy.addSegs(segEntries)
  let hiddenGroups = groupIntersectingEntries(hiddenEntries)
  let hiddenGroupEntries: SegEntry[] = hiddenGroups.map((hiddenGroup, index) => ({
    index: segs.length + index, // HACK: ensure no collision
    segGroup: hiddenGroup,
    span: hiddenGroup.span,
    thickness: 1, // HACK to ensure it's placed
  }))

  // add more-links into the hierarchy, but don't limit
  hierarchy.maxStackDepth = -1 // HACK
  hierarchy.addSegs(hiddenGroupEntries)

  let visibleRects = hierarchy.toRects()
  let segTops: { [instanceId: string]: number } = {}
  let hiddenGroupTops: { [key: string]: number } = {}

  for (let rect of visibleRects) {
    const { seg, segGroup } = rect

    if (seg) { // regular seg
      segTops[seg.eventRange.instance.instanceId] = rect.levelCoord
    } else { // hiddenGroup
      hiddenGroupTops[segGroup.key] = rect.levelCoord
    }
  }

  return [
    segTops,
    computeMaxBottom(segs, segTops, segHeights),
    hiddenGroups,
    hiddenGroupTops,
  ]
}

export function computeMaxBottom(
  segs: TimelineLaneSeg[],
  segTops: { [instanceId: string]: number },
  segHeights: Map<string, number>,
): number {
  let max = 0

  for (const seg of segs) {
    const { instanceId } = seg.eventRange.instance
    const top = segTops[instanceId]
    const height = segHeights.get(instanceId)

    if (top != null && height != null) {
      max = Math.max(max, top + height)
    }
  }

  return max
}

/*
TODO: converge with computeMaxBottom, but keys are different
*/
export function computeMoreLinkMaxBottom(
  hiddenGroups: SegGroup[],
  hiddenGroupTops: { [key: string]: number },
  hiddenGroupHeights: Map<string, number>,
): number {
  let max = 0

  for (const hiddenGroup of hiddenGroups) {
    const top = hiddenGroupTops[hiddenGroup.key]
    const height = hiddenGroupHeights.get(hiddenGroup.key)

    if (top != null && height != null) {
      max = Math.max(max, top + height)
    }
  }

  return max
}
