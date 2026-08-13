import { DateMarker } from '@full-ui/headless-calendar'
import { type EventRangeProps, getEventKey } from '../component-util/event-rendering'
import { DateProfile } from '../DateProfileGenerator'
import { type SourceSeg } from '../seg-placement/layout'
import { layoutTimeGridColumnByMaxLevel } from '../seg-placement/timegrid'
import { computeDateTopFrac } from './components/util'
import { type TimeGridRange } from './TimeColsSeg'

export type TimeGridEventSeg = TimeGridRange & EventRangeProps

/** One seg's final pixel geometry down the time axis. */
export interface TimeGridSegVertical {
  start: number // pixels
  end: number // pixels
  size: number // pixels
  isShort: boolean
}

/**
 * Projects production's date range onto the measured slat canvas.
 *
 * This is TimeGrid's production-specific coordinate conversion: it owns hidden
 * days, DST, and `eventMinHeight`. The shared engine consumes only the numbers
 * it produces. An unmeasured canvas yields no verticals at all.
 */
export function computeFgSegVerticals(
  segs: TimeGridRange[],
  dateProfile: DateProfile,
  colDate: DateMarker,
  slatCnt: number,
  slatHeight: number | undefined, // in pixels
  eventMinHeight: number | undefined, // in pixels
  eventShortHeight: number, // in pixels
): TimeGridSegVertical[] {
  const res: TimeGridSegVertical[] = []

  if (slatHeight != null) {
    const totalHeight = slatHeight * slatCnt

    for (const seg of segs) {
      const startFrac = computeDateTopFrac(seg.startDate, dateProfile, colDate)
      const endFrac = computeDateTopFrac(seg.endDate, dateProfile, colDate)
      const startCoord = startFrac * totalHeight
      let endCoord = endFrac * totalHeight
      let height = endCoord - startCoord

      if (eventMinHeight != null && height < eventMinHeight) {
        height = eventMinHeight
        endCoord = startCoord + height
      }

      res.push({
        start: startCoord,
        end: endCoord,
        size: height,
        isShort: height <= eventShortHeight,
      })
    }
  }

  return res
}

/** One admitted production seg with its normalized horizontal geometry. */
export interface TimeGridSegPlacement {
  seg: TimeGridEventSeg
  segVertical: TimeGridSegVertical
  levelCoord: number
  thickness: number
  stackDepth: number
  stackForward: number
}

/** One maximal intersecting pixel span of rejected production segs. */
export interface TimeGridSegHiddenGroup {
  key: string
  start: number
  end: number
  segs: TimeGridEventSeg[]
}

/** Production-facing output for one TimeGrid day or resource column. */
export interface TimeGridSegPlacementResult {
  /** Admitted segs in temporal-start then resolved-event-order DOM order. */
  placements: TimeGridSegPlacement[]
  /** Overlay more-link data in vertical pixel coordinates. */
  hiddenGroups: TimeGridSegHiddenGroup[]
}

/**
 * Adapts production TimeGrid segs to and from the shared placement engine.
 *
 * The caller owns vertical geometry: `segVerticals` already incorporates
 * clipping and `eventMinHeight`, and missing entries are excluded while slat
 * dimensions are unavailable. The engine owns only admission and normalized
 * horizontal placement. `slotEventOverlap` remains a final CSS concern, and
 * mirrors deliberately stay outside this normal-event admission path.
 */
export function buildTimeGridSegPlacements(
  segs: TimeGridEventSeg[],
  segVerticals: TimeGridSegVertical[],
  eventOrderStrict?: boolean,
  eventMaxStack?: number,
): TimeGridSegPlacementResult {
  const sourceSegs: SourceSeg<TimeGridEventSeg>[] = []
  const segVerticalBySeg = new Map<TimeGridEventSeg, TimeGridSegVertical>()

  for (let orderIndex = 0; orderIndex < segs.length; orderIndex += 1) {
    const seg = segs[orderIndex]
    const segVertical = segVerticals[orderIndex]

    if (segVertical) {
      sourceSegs.push({
        key: getEventKey(seg),
        start: segVertical.start,
        end: segVertical.end,
        isStart: seg.isStart,
        isEnd: seg.isEnd,
        meta: seg,
        orderIndex,
      })
      segVerticalBySeg.set(seg, segVertical)
    }
  }

  const layout = layoutTimeGridColumnByMaxLevel(
    sourceSegs,
    eventMaxStack ?? Infinity,
    { orderStrict: eventOrderStrict ?? false },
  )

  return {
    placements: layout.domOrderedPlacements.map((placement) => {
      const seg = placement.sourceSeg.meta
      return {
        seg,
        segVertical: segVerticalBySeg.get(seg)!,
        levelCoord: placement.levelCoord,
        thickness: placement.thickness,
        stackDepth: placement.backwardDepth,
        stackForward: placement.forwardDepth,
      }
    }),
    hiddenGroups: layout.moreLinkGroups.map((group) => {
      const groupSegs = group.hiddenSlices.map((slice) => slice.sourceSeg.meta)
      return {
        key: group.key,
        start: group.start,
        end: group.end,
        segs: groupSegs,
      }
    }),
  }
}
