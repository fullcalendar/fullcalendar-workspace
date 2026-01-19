import classNames from '@fullcalendar/preact/internal-classnames'

export function getTimelineSlotEl(parentEl: HTMLElement, index: number): HTMLElement {
  return parentEl.querySelectorAll(
    `.${classNames.internalTimelineSlot}`,
  )[index] as HTMLElement
}
