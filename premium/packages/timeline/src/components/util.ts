
export function getTimelineSlotEl(parentEl: HTMLElement, index: number): HTMLElement {
  return parentEl.querySelectorAll('.fc-timeline-slot')[index] as HTMLElement
}
