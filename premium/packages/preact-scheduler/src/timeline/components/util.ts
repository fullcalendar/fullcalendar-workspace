import classNames from '@fullcalendar/preact/protected-styles'

export function getTimelineSlotEl(parentEl: HTMLElement, index: number): HTMLElement {
  return parentEl.querySelectorAll(
    `.${classNames.internalTimelineSlot}`,
  )[index] as HTMLElement
}
