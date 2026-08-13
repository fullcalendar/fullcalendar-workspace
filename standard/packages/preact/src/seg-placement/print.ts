import {
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  DEFAULT_UNMEASURED_MORE_LINK_THICKNESS,
  planDomCandidatesByMaxLevel,
  type DomCandidatePlan,
  type HiddenSliceGroup,
  type PlacementLevel,
  type SegThicknessMap,
  type Slice,
  type SliceOptions,
  type SourceSeg,
} from './layout'

/** High but finite safety cap for event levels in either print view. */
export const DEFAULT_PRINT_MAX_LEVELS = 200

/**
 * Selects print DOM candidates from the complete source list.
 *
 * Print must never inherit the screen candidate frontier: it plans directly
 * from every event-ordered source with unit thickness. The default 200-level
 * cap is an internal safety constant, not a public option.
 */
export function planPrintDomCandidates<EventMeta>(
  eventOrderedSegs: readonly SourceSeg<EventMeta>[],
  sliceOptions: SliceOptions,
  printMaxLevels = DEFAULT_PRINT_MAX_LEVELS,
): DomCandidatePlan<EventMeta> {
  return planDomCandidatesByMaxLevel(
    eventOrderedSegs,
    printMaxLevels,
    sliceOptions,
  )
}

/**
 * One normal-flow print band backed by a single dimensionless event level.
 *
 * The band is a relatively positioned canvas. Its slices begin at level
 * coordinate zero because they never overlap laterally, while its explicit
 * thickness gives the renderer a page-breakable normal-flow box.
 */
export interface PrintEventBand<EventMeta = unknown> {
  levelIndex: number
  slices: Slice<EventMeta>[]
  /** Tallest current or fallback occupied source thickness in this band. */
  thickness: number
}

/**
 * Timeline's single final print band for every hidden-slice more link.
 *
 * It renders after all event bands and never counts against the 200 event-level
 * safety cap. Each link starts at `top: 0` within this band canvas: print gives
 * up screen skyline compaction so links paginate together. DayGrid does not
 * use this structure because it prints links outside the event bands.
 */
export interface PrintMoreLinkBand<EventMeta = unknown> {
  moreLinkGroups: HiddenSliceGroup<EventMeta>[]
  /** Tallest current or fallback occupied link thickness in this band. */
  thickness: number
}

/**
 * Projects dimensionless levels into independently page-breakable bands.
 *
 * The level entries may carry unit-thickness planning coordinates, but those
 * coordinates have no print meaning. Every print slice begins at level
 * coordinate zero in its own band, whose thickness is the largest current
 * source-wrapper measurement. Missing measurements use the supplied fallback.
 * Empty or sparse levels do not create empty DOM bands.
 */
export function buildPrintEventBands<EventMeta>(
  levels: readonly PlacementLevel<EventMeta>[],
  printEventThicknesses: SegThicknessMap,
  defaultPrintEventThickness = DEFAULT_UNMEASURED_EVENT_THICKNESS,
): PrintEventBand<EventMeta>[] {
  const bands: PrintEventBand<EventMeta>[] = []

  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const entries = levels[levelIndex]
    if (!entries?.length) continue

    let thickness = 0
    const slices = entries.map((entry) => {
      thickness = Math.max(
        thickness,
        printEventThicknesses.get(entry.sourceSeg.key) ??
          defaultPrintEventThickness,
      )
      return {
        sourceSeg: entry.sourceSeg,
        start: entry.start,
        end: entry.end,
        isStart: entry.isStart,
        isEnd: entry.isEnd,
      }
    })

    bands.push({
      levelIndex,
      slices,
      thickness,
    })
  }

  return bands
}

/** Builds Timeline's one final print more-link band when hidden groups exist. */
export function buildPrintMoreLinkBand<EventMeta>(
  moreLinkGroups: readonly HiddenSliceGroup<EventMeta>[],
  printMoreLinkHeights: ReadonlyMap<string, number>,
  defaultPrintMoreLinkHeight = DEFAULT_UNMEASURED_MORE_LINK_THICKNESS,
): PrintMoreLinkBand<EventMeta> | null {
  if (!moreLinkGroups.length) return null

  return {
    moreLinkGroups: [...moreLinkGroups],
    thickness: Math.max(...moreLinkGroups.map((group) =>
      printMoreLinkHeights.get(group.key) ?? defaultPrintMoreLinkHeight,
    )),
  }
}
