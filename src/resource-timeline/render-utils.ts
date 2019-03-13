
export function updateExpanderIcon(el: HTMLElement, isExpanded: boolean) {
  let { classList } = el

  if (isExpanded) {
    classList.remove('fc-icon-plus-square')
    classList.add('fc-icon-minus-square')
  } else {
    classList.remove('fc-icon-minus-square')
    classList.add('fc-icon-plus-square')
  }
}

export function clearExpanderIcon(el: HTMLElement) {
  let { classList } = el

  classList.remove('fc-icon-minus-square')
  classList.remove('fc-icon-plus-square')
}

export function updateTrResourceId(tr: HTMLElement, resourceId: string) {
  tr.setAttribute('data-resource-id', resourceId)
}
