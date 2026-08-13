import {
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  type PlacementLevel,
  type SegThicknessMap,
  type Slice,
} from './layout'

/** High but finite safety cap for event levels in either print view. */
export const DEFAULT_PRINT_MAX_LEVELS = 200

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
