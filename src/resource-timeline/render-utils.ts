
export function updateExpanderIcon(el: HTMLElement, isExpanded: boolean) {
  let { classList } = el

  if (isExpanded) {
    classList.remove('fc-icon-expand')
    classList.add('fc-icon-contract')
  } else {
    classList.remove('fc-icon-contract')
    classList.add('fc-icon-expand')
  }
}

export function clearExpanderIcon(el: HTMLElement) {
  let { classList } = el

  classList.remove('fc-icon-contract')
  classList.remove('fc-icon-expand')
}

export function updateTrResourceId(tr: HTMLElement, resourceId: string) {
  tr.setAttribute('data-resource-id', resourceId)
}
