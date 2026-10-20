import { getElEventRange } from 'fullcalendar/protected-api'
import classNames from 'fullcalendar/protected-styles'
import { Point } from '../pointer'

export function queryParts(root: ParentNode, part: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`[data-fc-part~="${part}"]`))
}

export function queryPart(root: ParentNode, part: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-fc-part~="${part}"]`)
}

/*
Event elements (one per rendered segment) for the event with the given id, or all events.
Excludes drag/resize mirrors.
*/
export function getEventEls(root: ParentNode, eventId?: string): HTMLElement[] {
  return queryParts(root, 'event').filter((el) => {
    const eventRange = getElEventRange(el)
    return eventRange && !isMirrorEl(el) && (eventId == null || eventRange.def.publicId === eventId)
  })
}

export function getEventIdOfEl(el: HTMLElement): string {
  return getElEventRange(el)!.def.publicId
}

export function isElVisible(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
}

export function getMirrorEls(root: ParentNode): HTMLElement[] {
  return queryParts(root, 'event').filter(isMirrorEl)
}

function isMirrorEl(el: HTMLElement): boolean {
  return el.classList.contains(classNames.internalEventMirror)
}

/*
Throws unless the topmost element at the point is (inside) the expected element.
Raw mouse input has no covered-target check of its own, so models call this before acting.
*/
export function assertPointHits(point: Point, expectedEl: HTMLElement, what: string): void {
  const hitEl = document.elementFromPoint(point.x, point.y)

  if (!hitEl || !expectedEl.contains(hitEl)) {
    throw new Error(
      `Point (${Math.round(point.x)}, ${Math.round(point.y)}) for ${what} hits ` +
      `${describeEl(hitEl)} instead of ${describeEl(expectedEl)}`,
    )
  }
}

function describeEl(el: Element | null): string {
  if (!el) {
    return 'nothing'
  }
  const part = el.getAttribute('data-fc-part')
  return `<${el.tagName.toLowerCase()}${part ? ` data-fc-part="${part}"` : ''}>`
}
