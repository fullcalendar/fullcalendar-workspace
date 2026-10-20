import { getElEventRange } from 'fullcalendar/protected-api'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { queryPart, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'

/*
Read-only layout queries for timeline views (resource or not): slot headers and lanes, horizontal
positions of times, and the resource area's rows and cells. Complements TimelineModel, which drives
input.
*/

export function isRtl(root: HTMLElement): boolean {
  return getComputedStyle(root).direction === 'rtl'
}

/*
The time area's slot lanes (one per slot, in time order). Day-or-bigger slots have date-only
data-date attributes.
*/
export function getSlotLanes(root: HTMLElement): HTMLElement[] {
  return queryParts(root, 'slotLane').filter((el) => el.hasAttribute('data-date'))
}

/*
The nearest ancestor that scrolls horizontally (overflow-x auto/scroll), ex: the time area's body
scroller for a slot lane, or the time header's scroller for a slot header.
*/
export function getHorizontalScroller(el: HTMLElement): HTMLElement {
  for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const { overflowX } = getComputedStyle(ancestor)

    if (overflowX === 'auto' || overflowX === 'scroll') {
      return ancestor
    }
  }
  throw new Error('No horizontal scroller')
}

/*
The time area's body scroller.
*/
export function getTimeScroller(root: HTMLElement): HTMLElement {
  return getHorizontalScroller(getSlotLanes(root)[0])
}

/*
Throws unless the element's start edge is at the scroller's visible start edge (its left inside the
border in LTR), i.e. the scroller is scrolled to the element.
*/
export function expectScrolledTo(scrollerEl: HTMLElement, el: HTMLElement, tolerance = 1): void {
  const scrollerRect = scrollerEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const delta = elRect.left - (scrollerRect.left + scrollerEl.clientLeft)

  if (Math.abs(delta) > tolerance) {
    throw new Error(`Expected scroller's visible start at the element, but they're ${round(delta)}px apart`)
  }
}

export function getSlotDates(root: HTMLElement): string[] {
  return getSlotLanes(root).map((el) => el.getAttribute('data-date')!)
}

/*
Slot header cells by header row (row 0 is the coarsest).
*/
export function getSlotHeaderRows(root: HTMLElement): HTMLElement[][] {
  return queryParts(root, 'slotHeaderRow').map((rowEl) => queryParts(rowEl, 'slotHeader'))
}

export function getSlotHeaderDates(root: HTMLElement, row = -1): string[] {
  return getSlotHeaderRows(root).at(row)!.map((el) => el.getAttribute('data-date')!)
}

/*
The slot lane (or slot header, when `part` is 'slotHeader') with the given data-date. Throws unless
there's exactly one.
*/
export function getSlotEl(root: HTMLElement, date: string, part: 'slotLane' | 'slotHeader' = 'slotLane'): HTMLElement {
  const els = queryParts(root, part).filter((el) => el.getAttribute('data-date') === date)

  if (els.length !== 1) {
    throw new Error(`Expected one ${part} for ${date}, found ${els.length}`)
  }
  return els[0]
}

/*
An element's horizontal extent along the time axis: `start` is its left edge in LTR, right in RTL.
*/
export function getTimeAxisEdges(el: Element, rtl: boolean): { start: number, end: number } {
  const rect = el.getBoundingClientRect()
  return rtl ? { start: rect.right, end: rect.left } : { start: rect.left, end: rect.right }
}

/*
The x of a slot boundary: where the slot that starts at `dateTime` begins, or where the slot that
the boundary ends finishes (for the last slot, or before omitted time like a slotMaxTime cutoff).
Times are wall-clock, like slots' data-date. For slots that share a wall-clock time (DST), use
getSlotEdgeX with an index.
*/
export function getTimeBoundaryX(root: HTMLElement, dateTime: string): number {
  const slotLanes = getSlotLanes(root)
  const slotMs = slotLanes.map((el) => parseWallClockMs(el.getAttribute('data-date')!))
  const ms = parseWallClockMs(dateTime)
  const rtl = isRtl(root)
  const startIndex = slotMs.indexOf(ms)

  if (startIndex !== -1) {
    if (slotMs.lastIndexOf(ms) !== startIndex) {
      throw new Error(`Time ${dateTime} starts several slots (DST). Address it by slot index`)
    }
    return getTimeAxisEdges(slotLanes[startIndex], rtl).start
  }

  // the end of a slot not followed by the next contiguous one
  const slotDurationMs = getMinSlotStep(slotMs)
  for (let i = 0; i < slotMs.length; i++) {
    if (slotMs[i] + slotDurationMs === ms) {
      return getTimeAxisEdges(slotLanes[i], rtl).end
    }
  }

  throw new Error(`Time ${dateTime} isn't a rendered slot boundary`)
}

/*
The x of the start of the slot at `index`, or the end of the last slot when `index` is the slot count.
*/
export function getSlotEdgeX(root: HTMLElement, index: number): number {
  const slotLanes = getSlotLanes(root)
  const rtl = isRtl(root)

  return index === slotLanes.length
    ? getTimeAxisEdges(slotLanes[index - 1], rtl).end
    : getTimeAxisEdges(slotLanes[index], rtl).start
}

/*
Throws unless the element starts and ends at the given x coordinates (along the time axis).
Sub-pixel layout can differ by a pixel.
*/
export function expectElAtX(
  el: Element,
  rtl: boolean,
  startX: number,
  endX: number,
  tolerance = 1.5,
): void {
  const edges = getTimeAxisEdges(el, rtl)

  if (Math.abs(edges.start - startX) > tolerance || Math.abs(edges.end - endX) > tolerance) {
    throw new Error(
      `Expected element to span ${round(startX)}..${round(endX)}, but it spans ` +
      `${round(edges.start)}..${round(edges.end)}`,
    )
  }
}

/*
Throws unless the element spans the slots from `startIndex` up to (not including) `endIndex`.
*/
export function expectElSpansSlots(root: HTMLElement, el: Element, startIndex: number, endIndex: number): void {
  expectElAtX(el, isRtl(root), getSlotEdgeX(root, startIndex), getSlotEdgeX(root, endIndex))
}

/*
Throws unless the element spans from one slot boundary to another (wall-clock times).
*/
export function expectElSpansTimes(root: HTMLElement, el: Element, start: string, end: string): void {
  expectElAtX(el, isRtl(root), getTimeBoundaryX(root, start), getTimeBoundaryX(root, end))
}

/*
Background (and inverse-background) event elements, optionally for one event or resource lane.
*/
export function getBackgroundEventEls(root: ParentNode, eventId?: string): HTMLElement[] {
  return queryParts(root, 'backgroundEvent').filter((el) => (
    eventId == null || getElEventRange(el)?.def.publicId === eventId
  ))
}

/*
Non-business-hours fills, sorted along the time axis.
*/
export function getNonBusinessEls(container: HTMLElement): HTMLElement[] {
  return sortByLeft(queryParts(container, 'nonBusinessHours'))
}

export function getResourceLanes(root: HTMLElement): HTMLElement[] {
  return sortByTop(queryParts(root, 'resourceLane'))
}

export function getResourceLane(root: HTMLElement, resourceId: string): HTMLElement {
  const laneEl = queryParts(root, 'resourceLane').find((el) => el.getAttribute('data-resource-id') === resourceId)

  if (!laneEl) {
    throw new Error(`No lane for resource ${resourceId}`)
  }
  return laneEl
}

export interface ResourceAreaRow {
  type: 'resource' | 'group'
  resourceId?: string
  text: string
  el: HTMLElement // the resource's first cell, or the group header
}

/*
The resource area's rows, top to bottom: resources (by their first cell) and group headers.
Only rendered rows are included (virtualization can omit some).
*/
export function getResourceAreaRows(root: HTMLElement): ResourceAreaRow[] {
  const resourceRows: ResourceAreaRow[] = queryParts(root, 'resourceCell')
    .filter((el) => el.getAttribute('role') === 'rowheader')
    .map((el) => ({
      type: 'resource',
      resourceId: el.getAttribute('data-resource-id')!,
      text: getText(el),
      el,
    }))
  const groupRows: ResourceAreaRow[] = queryParts(root, 'resourceGroupHeader')
    .map((el) => ({ type: 'group', text: getText(el), el }))

  return [...resourceRows, ...groupRows].sort((a, b) => (
    a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top
  ))
}

export function getResourceIds(root: HTMLElement): string[] {
  return getResourceAreaRows(root)
    .filter((row) => row.type === 'resource')
    .map((row) => row.resourceId!)
}

/*
The resource's cells in the resource area, one per column, left to right.
*/
export function getResourceCells(root: HTMLElement, resourceId: string): HTMLElement[] {
  return sortByLeft(
    queryParts(root, 'resourceCell').filter((el) => el.getAttribute('data-resource-id') === resourceId),
  )
}

export function getResourceColumnHeaders(root: HTMLElement): HTMLElement[] {
  return sortByLeft(queryParts(root, 'resourceColumnHeader'))
}

/*
Clicks the expander of a resource or group row, then waits for rendering.
*/
export async function clickExpander(rowEl: HTMLElement): Promise<void> {
  const expanderEl = queryPart(rowEl, 'resourceExpander')

  if (!expanderEl) {
    throw new Error('Row has no expander')
  }
  await pointer.click(getRectCenter(expanderEl.getBoundingClientRect()))
  await waitForSettle()
}

export function getText(el: Element): string {
  return (el.textContent || '').trim()
}

function sortByLeft(els: HTMLElement[]): HTMLElement[] {
  return els.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
}

function sortByTop(els: HTMLElement[]): HTMLElement[] {
  return els.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
}

function getMinSlotStep(slotMs: number[]): number {
  let minStep = Infinity

  for (let i = 1; i < slotMs.length; i++) {
    const step = slotMs[i] - slotMs[i - 1]
    if (step > 0 && step < minStep) {
      minStep = step
    }
  }
  return minStep
}

function parseWallClockMs(dateTime: string): number {
  return Date.parse(dateTime.includes('T') ? dateTime + 'Z' : dateTime + 'T00:00:00Z')
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}
