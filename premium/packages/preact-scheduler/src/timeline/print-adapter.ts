import {
  type DateEnv,
  type DomCandidatePlan,
  type HiddenSliceGroup,
  type PrintEventBand,
  type PrintMoreLinkBand,
  RefMap,
  afterSize,
  buildPrintEventBands,
  buildPrintMoreLinkBand,
  groupHiddenSlices,
  planPrintDomCandidates,
} from '@fullcalendar/preact/protected-api'
import { type TimelineDateProfile } from './timeline-date-profile'
import {
  type TimelineEventSeg,
  buildTimelineSegSources,
} from './seg-placement-adapter'

export interface TimelinePrintPlan extends DomCandidatePlan<TimelineEventSeg> {
  moreLinkGroups: HiddenSliceGroup<TimelineEventSeg>[]
}

export interface TimelinePrintLayout {
  eventBands: PrintEventBand<TimelineEventSeg>[]
  moreLinkBand: PrintMoreLinkBand<TimelineEventSeg> | null
}

/** Projects complete Timeline geometry and plans print-only DOM candidates. */
export function buildTimelinePrintPlan(
  segs: TimelineEventSeg[],
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
  eventMinWidth?: number,
  eventOrderStrict?: boolean,
): TimelinePrintPlan {
  const sourceSegs = buildTimelineSegSources(
    segs,
    eventMinWidth,
    dateEnv,
    tDateProfile,
    slotWidth,
  )
  const candidatePlan = planPrintDomCandidates(sourceSegs, {
    orderStrict: eventOrderStrict ?? false,
    eventSlicing: false,
    maxSlices: 1,
  })

  return {
    ...candidatePlan,
    moreLinkGroups: groupHiddenSlices(candidatePlan.hiddenSlices),
  }
}

/** Builds normal-flow event bands and Timeline's one final more-link band. */
export function buildTimelinePrintLayout(
  plan: TimelinePrintPlan,
  printSegHeights: ReadonlyMap<string, number>,
  printLinkHeights: ReadonlyMap<string, number>,
): TimelinePrintLayout {
  return {
    eventBands: buildPrintEventBands(plan.levels, printSegHeights),
    moreLinkBand: buildPrintMoreLinkBand(
      plan.moreLinkGroups,
      printLinkHeights,
    ),
  }
}

/**
 * The measurement half of Timeline print, shared by the standalone lane and
 * the resource row.
 *
 * Both renderers mount the same wrappers against the same two maps, so the
 * ownership rules live here once. Event wrappers ignore deletes because a
 * source can change bands when `slotWidth` changes, and a departing wrapper's
 * removal must not clobber the arriving wrapper's live entry.
 */
export class TimelinePrintHeights {
  readonly segHeightRefMap: RefMap<string, number>
  readonly linkHeightRefMap: RefMap<string, number>

  /** `onSettled` must be a stable reference, since `afterSize` dedupes by it. */
  constructor(onSettled: () => void) {
    const handleChange = () => {
      afterSize(onSettled)
    }
    this.segHeightRefMap = new RefMap<string, number>(handleChange, true)
    this.linkHeightRefMap = new RefMap<string, number>(handleChange)
  }

  buildLayout(plan: TimelinePrintPlan): TimelinePrintLayout {
    return buildTimelinePrintLayout(
      plan,
      this.segHeightRefMap.current,
      this.linkHeightRefMap.current,
    )
  }
}
