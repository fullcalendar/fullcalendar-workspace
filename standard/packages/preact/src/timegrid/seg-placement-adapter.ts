import { DateMarker } from '@full-ui/headless-calendar'
import { type EventRangeProps, getEventSegKey } from '../component-util/event-rendering'
import { DateProfile } from '../DateProfileGenerator'
import { layoutTimeGridColumnByMaxLevel } from './seg-placement'
import { computeDateTopFrac } from './components/util'
import { type TimeGridRange } from './TimeColsSeg'

export type TimeGridEventSeg = TimeGridRange & EventRangeProps

/**
 * A projected copy of a production seg satisfying the kernel's seg
 * requirements: the seg's own fields plus identity and its vertical pixel span
 * (the production seg carries only dates).
 */
type TimeGridSourceSeg = TimeGridEventSeg & {
  key: string
  start: number
  end: number
  orderIndex: number
}

/** One seg's final pixel geometry down the time axis. */
export interface TimeGridSegVertical {
  start: number // pixels
  end: number // pixels
  size: number // pixels
  isShort: boolean
}

/**
 * Projects production's date range onto the slat canvas.
 *
 * This is TimeGrid's production-specific coordinate conversion: it owns hidden
 * days, DST, and `eventMinHeight`. The shared engine consumes only the numbers
 * it produces.
 *
 * The canvas height may be assumed rather than measured — callers substitute
 * `ESTIMATED_SLAT_HEIGHT` so the first paint contains events — in which case
 * they also pass no `eventMinHeight`. A null height still yields no verticals,
 * but no production caller passes one.
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
 * clipping, and `eventMinHeight` too once the slat height is measured — the
 * caller withholds that floor while the height is only assumed. Any missing
 * entry is excluded. The engine owns only admission and normalized horizontal
 * placement. `slotEventOverlap` remains a final CSS concern, and mirrors
 * deliberately stay outside this normal-event admission path.
 */
export function buildTimeGridSegPlacements(
  segs: TimeGridEventSeg[],
  segVerticals: TimeGridSegVertical[],
  eventOrderStrict?: boolean,
  eventMaxStack?: number,
): TimeGridSegPlacementResult {
  const sourceSegs: TimeGridSourceSeg[] = []
  const segVerticalBySeg = new Map<TimeGridEventSeg, TimeGridSegVertical>()

  for (let orderIndex = 0; orderIndex < segs.length; orderIndex += 1) {
    const seg = segs[orderIndex]
    const segVertical = segVerticals[orderIndex]

    if (segVertical) {
      const sourceSeg: TimeGridSourceSeg = {
        ...seg,
        key: getEventSegKey(seg),
        start: segVertical.start,
        end: segVertical.end,
        orderIndex,
      }
      sourceSegs.push(sourceSeg)
      segVerticalBySeg.set(sourceSeg, segVertical)
    }
  }

  const layout = layoutTimeGridColumnByMaxLevel(
    sourceSegs,
    eventMaxStack ?? Infinity,
    { orderStrict: eventOrderStrict ?? false },
  )

  return {
    placements: layout.domOrderedPlacements.map((placement) => {
      const seg = placement.sourceSeg
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
      const groupSegs = group.hiddenSlices.map((slice) => slice.sourceSeg)
      return {
        key: group.key,
        start: group.start,
        end: group.end,
        segs: groupSegs,
      }
    }),
  }
}
