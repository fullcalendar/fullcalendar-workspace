import classNames from '@fullcalendar/core/internal-classnames'

export function getTimelineSlotEl(parentEl: HTMLElement, index: number): HTMLElement {
  return parentEl.querySelectorAll(
    `.${classNames.internalTimelineSlot}`,
  )[index] as HTMLElement
}
