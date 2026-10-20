import {
  type DateEnv,
  type PrintCandidatePlan,
  type PrintEventBand,
  type PrintMoreLinkBand,
  RefMap,
  afterSize,
  buildPrintEventBands,
  buildPrintMoreLinkBand,
  groupLaterallyIntersecting,
  planPrintDomCandidates,
  sortEventSegs,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { type TimelineDateProfile } from './timeline-date-profile'
import {
  type TimelineEventSeg,
  type TimelineSourceSeg,
  buildTimelineSegSources,
} from './seg-placement-adapter'
import { resolveTimelineEventProjectionSizing } from './slot-estimate'

export interface TimelinePrintLayout {
  eventBands: PrintEventBand<TimelineSourceSeg>[]
  moreLinkBand: PrintMoreLinkBand<TimelineSourceSeg> | null
}

/** Projects complete Timeline geometry and plans print-only DOM candidates. */
export function buildTimelinePrintPlan(
  segs: TimelineEventSeg[],
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
  eventMinWidth?: number,
  eventOrderStrict = false,
): PrintCandidatePlan<TimelineSourceSeg> {
  const sourceSegs = buildTimelineSegSources(
    segs,
    eventMinWidth,
    dateEnv,
    tDateProfile,
    slotWidth,
  )
  return planPrintDomCandidates(sourceSegs, eventOrderStrict, false)
}

/** Builds normal-flow event bands and Timeline's one final more-link band. */
export function buildTimelinePrintLayout(
  plan: PrintCandidatePlan<TimelineSourceSeg>,
  printSegHeights: ReadonlyMap<string, number>,
  printMoreLinkHeights: ReadonlyMap<string, number>,
): TimelinePrintLayout {
  return {
    eventBands: buildPrintEventBands(plan.sliceLevels, printSegHeights),
    moreLinkBand: buildPrintMoreLinkBand(
      groupLaterallyIntersecting(plan.hiddenSlices),
      printMoreLinkHeights,
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
  readonly moreLinkHeightRefMap: RefMap<string, number>

  /** `onSettled` must be a stable reference, since `afterSize` dedupes by it. */
  constructor(onSettled: () => void) {
    const handleChange = () => {
      afterSize(onSettled)
    }
    this.segHeightRefMap = new RefMap<string, number>(handleChange, true)
    this.moreLinkHeightRefMap = new RefMap<string, number>(handleChange)
  }

  buildLayout(plan: PrintCandidatePlan<TimelineSourceSeg>): TimelinePrintLayout {
    return buildTimelinePrintLayout(
      plan,
      this.segHeightRefMap.current,
      this.moreLinkHeightRefMap.current,
    )
  }
}

/*
The hook form of TimelinePrintRenderer, for function components: the shared pipeline (sort,
projection sizing, plan, measured band layout), re-rendering when the measured heights settle
*/
export function useTimelinePrintBands(
  fgEventSegs: TimelineEventSeg[],
  tDateProfile: TimelineDateProfile,
  slotWidth: number | undefined,
): { layout: TimelinePrintLayout, printHeights: TimelinePrintHeights } {
  const { options, dateEnv } = useViewContext()
  const [, setRenderCount] = useState(0)
  const isActiveRef = useRef(false)
  const [printHeights] = useState(() => new TimelinePrintHeights(() => {
    if (isActiveRef.current) {
      setRenderCount(incrementCounter)
    }
  }))

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

  const fgSegs = useMemo(
    () => sortEventSegs(fgEventSegs, options.eventOrder),
    [fgEventSegs, options.eventOrder],
  )
  const projectionSizing = resolveTimelineEventProjectionSizing(
    slotWidth,
    options.eventMinWidth,
  )
  const plan = useMemo(
    () => buildTimelinePrintPlan(
      fgSegs,
      dateEnv,
      tDateProfile,
      projectionSizing.slotWidth,
      projectionSizing.eventMinWidth,
      options.eventOrderStrict,
    ),
    [fgSegs, dateEnv, tDateProfile, projectionSizing.slotWidth, projectionSizing.eventMinWidth, options.eventOrderStrict],
  )

  return { layout: printHeights.buildLayout(plan), printHeights }
}

function incrementCounter(n: number): number {
  return n + 1
}
