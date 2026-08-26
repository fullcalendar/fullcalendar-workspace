import {
  BaseComponent,
  type DateEnv,
  type HiddenSliceGroup,
  type PrintCandidatePlan,
  type PrintEventBand,
  type PrintMoreLinkBand,
  RefMap,
  afterSize,
  buildPrintEventBands,
  buildPrintMoreLinkBand,
  groupLaterallyIntersecting,
  memoize,
  planPrintDomCandidates,
  sortEventSegs,
} from '@fullcalendar/preact/protected-api'
import { type TimelineDateProfile } from './timeline-date-profile'
import {
  type TimelineEventSeg,
  buildTimelineSegSources,
} from './seg-placement-adapter'
import { resolveTimelineEventProjectionSizing } from './slot-estimate'

interface TimelinePrintPlan extends PrintCandidatePlan<TimelineEventSeg> {
  moreLinkGroups: HiddenSliceGroup<TimelineEventSeg>[]
}

interface TimelinePrintLayout {
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
    eventOrderStrict: eventOrderStrict ?? false,
    eventSlicing: false,
  })

  return {
    ...candidatePlan,
    moreLinkGroups: groupLaterallyIntersecting(candidatePlan.hiddenSlices),
  }
}

/** Builds normal-flow event bands and Timeline's one final more-link band. */
export function buildTimelinePrintLayout(
  plan: TimelinePrintPlan,
  printSegHeights: ReadonlyMap<string, number>,
  printLinkHeights: ReadonlyMap<string, number>,
): TimelinePrintLayout {
  return {
    eventBands: buildPrintEventBands(plan.sliceLevels, printSegHeights),
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
class TimelinePrintHeights {
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

/**
 * Base for the two Timeline print renderers (standalone lane and resource
 * row). Owns the whole shared pipeline — sort → projection sizing → plan →
 * measured band layout — plus the measurement/settle lifecycle, so the two
 * renderers cannot silently diverge.
 */
export abstract class TimelinePrintRenderer<Props> extends BaseComponent<Props> {
  // memo
  private sortSegs = memoize(sortEventSegs)
  private buildPlan = memoize(buildTimelinePrintPlan)

  // refs
  protected printHeights = new TimelinePrintHeights(() => {
    if (!this._isUnmounting) {
      this.forceUpdate()
    }
  })

  // internal
  private _isUnmounting: boolean

  protected buildPrintBands(
    fgEventSegs: TimelineEventSeg[],
    tDateProfile: TimelineDateProfile,
    slotWidth: number | undefined,
  ): TimelinePrintLayout {
    const { options, dateEnv } = this.context
    const fgSegs = this.sortSegs(fgEventSegs, options.eventOrder)
    const projectionSizing = resolveTimelineEventProjectionSizing(
      slotWidth,
      options.eventMinWidth,
    )
    const plan = this.buildPlan(
      fgSegs,
      dateEnv,
      tDateProfile,
      projectionSizing.slotWidth,
      projectionSizing.eventMinWidth,
      options.eventOrderStrict,
    )
    return this.printHeights.buildLayout(plan)
  }

  componentDidMount(): void {
    this._isUnmounting = false
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
  }
}
