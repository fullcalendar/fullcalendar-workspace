import {
  type DateEnv,
  type DomCandidatePlan,
  type HiddenSliceGroup,
  type PrintEventBand,
  type PrintMoreLinkBand,
  type SourceSeg,
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
  sourceSegs: SourceSeg<TimelineEventSeg>[]
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
    sourceSegs,
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
