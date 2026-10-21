import { EventRenderRange } from '../../event-segs/event-ranges'

// the event range an event's element renders, which interactions read back from the element
export function setElEventRange(el: HTMLElement, eventRange: EventRenderRange) {
  (el as any).fcEventRange = eventRange
}

export function getElEventRange(el: HTMLElement): EventRenderRange | null {
  return (el as any).fcEventRange ||
    (el.parentNode as any).fcEventRange || // for the harness
    null
}
