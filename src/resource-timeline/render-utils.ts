
const LEFT_TRIANGLE_ICON = 'fc-icon-left-triangle'
const RIGHT_TRIANGLE_ICON = 'fc-icon-right-triangle'
const DOWN_TRIANGLE_ICON = 'fc-icon-down-triangle'

export function updateExpanderIcon(el: HTMLElement, isExpanded: boolean, isRtl: boolean) {
  let { classList } = el

  if (isExpanded) {
    classList.remove(LEFT_TRIANGLE_ICON)
    classList.remove(RIGHT_TRIANGLE_ICON)
    classList.add(DOWN_TRIANGLE_ICON)
  } else {
    classList.remove(DOWN_TRIANGLE_ICON)
    classList.add(isRtl ? LEFT_TRIANGLE_ICON : RIGHT_TRIANGLE_ICON)
  }
}

export function clearExpanderIcon(el: HTMLElement) {
  let { classList } = el

  classList.remove(LEFT_TRIANGLE_ICON)
  classList.remove(RIGHT_TRIANGLE_ICON)
  classList.remove(DOWN_TRIANGLE_ICON)
}

export function updateTrResourceId(tr: HTMLElement, resourceId: string) {
  tr.setAttribute('data-resource-id', resourceId)
}
