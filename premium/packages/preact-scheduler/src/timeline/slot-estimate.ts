/**
 * Slot width assumed on the first render, before the real one is measured.
 * Shared by standalone Timeline and Resource Timeline.
 *
 * Without it, `computeSegHorizontals` projects every seg to zero width and
 * drops it, so the lane paints a frame containing no events at all and the
 * calendar looks empty until measurement lands. Projecting against an assumed
 * width instead means events are present in that very first paint.
 *
 * A flat constant is enough, and deliberately so. Placement compares segs
 * against each other and never against the axis length, so in exact arithmetic
 * scaling every coordinate by the same factor preserves the lateral collision
 * graph and the unit-thickness candidate plan among the segs that project. That
 * is why callers withhold `eventMinWidth` while assuming — a pixel floor applied
 * at the wrong scale would stretch the wrong segs, and stretching is what
 * creates collisions.
 *
 * That is a much weaker promise than "the layout comes out the same", and
 * deliberately so. Four things can still differ once the width is real:
 *
 * - `eventMinWidth` comes back on, and stretching a sub-minimum seg can make it
 *   collide with a neighbor it previously cleared, changing level assignment
 *   and admission under `eventMaxStack`.
 * - Wrapper heights are measured at the rendered width, and a narrower bar
 *   wraps its content taller; that thickness feeds level fitting.
 * - The virtualized clip window can settle on a different slot range, changing
 *   which segs project at all.
 * - Scale invariance is exact only in real arithmetic, so an adjacency sitting
 *   on the last bit may still resolve one way when assumed and the other way
 *   when measured. Both endpoints now come straight from the projection, which
 *   removes the systematic source of this, but does not make float arithmetic
 *   scale-invariant in general.
 *
 * So the assumed pass is a good-faith first draft, not a guarantee about the
 * measured one. Anything latched from it upward — a reported height, say —
 * needs to wait for a measured width instead.
 */
export const ESTIMATED_SLOT_WIDTH = 50
