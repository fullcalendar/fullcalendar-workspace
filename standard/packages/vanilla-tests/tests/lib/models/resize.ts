import classNames from 'fullcalendar/protected-styles'
import { getRectCenter, Point, pointer } from '../pointer'
import { waitForSettle } from '../settle'
import { assertPointHits } from './events'

export type ResizeEdge = 'start' | 'end'

/*
The event segment's resize handle for the edge. Handles only take up space while the event is
hovered (or selected, for touch), so hover first.
*/
export function getResizerEl(eventEl: HTMLElement, edge: ResizeEdge): HTMLElement | null {
  return eventEl.querySelector<HTMLElement>(
    '.' + (edge === 'start' ? classNames.internalEventResizerStart : classNames.internalEventResizerEnd),
  )
}

/*
Hovers the segment to reveal its handle, presses the handle, and moves it by the distance between
the edge's old and new positions (points from `fromAnchor` and `toAnchor`), so the hit under the
pointer moves by exactly the intended amount.

`fromAnchor` is measured before the press and `toAnchor` after, because locating the target can
scroll. The handle keeps its offset from the anchor, which content scrolling doesn't change.
*/
export async function resizeSegment(
  eventEl: HTMLElement,
  edge: ResizeEdge,
  fromAnchor: () => Point,
  toAnchor: () => Point,
  whileResizing?: () => Promise<void>,
): Promise<void> {
  const fromPoint = fromAnchor()
  await pointer.move(getRectCenter(eventEl.getBoundingClientRect()), 1)
  await waitForSettle()

  const resizerEl = getResizerEl(eventEl, edge)
  if (!resizerEl) {
    throw new Error(`The event has no ${edge} resize handle. Is it resizable?`)
  }

  const grabPoint = getRectCenter(resizerEl.getBoundingClientRect())
  assertPointHits(grabPoint, resizerEl, `the ${edge} resize handle`)

  await pointer.press(grabPoint, async () => {
    const toPoint = toAnchor()
    await pointer.move({ x: toPoint.x + grabPoint.x - fromPoint.x, y: toPoint.y + grabPoint.y - fromPoint.y })
    await waitForSettle()

    if (whileResizing) {
      await whileResizing()
    }
  })
  await waitForSettle()
}
