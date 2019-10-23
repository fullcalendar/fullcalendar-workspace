
export function updateExpanderEl(props: { expanderWrapEl: HTMLElement, expanderIconEl: HTMLElement, isVisible: boolean, isExpanded: boolean }) {
  let { expanderWrapEl, expanderIconEl } = props

  if (props.isVisible) {
    expanderWrapEl.classList.add('fc-expander')

    if (props.isExpanded) {
      expanderIconEl.classList.add('fc-icon-minus-square')
    } else {
      expanderIconEl.classList.add('fc-icon-plus-square')
    }
  }

  return props
}


export function clearExpanderEl(props: { expanderWrapEl: HTMLElement, expanderIconEl: HTMLElement, isVisible: boolean, isExpanded: boolean }) {
  let { expanderWrapEl, expanderIconEl } = props

  expanderWrapEl.classList.remove('fc-expander')
  expanderIconEl.classList.remove('fc-icon-minus-square')
  expanderIconEl.classList.remove('fc-icon-plus-square')
}


export function updateTrResourceId(tr: HTMLElement, resourceId: string) {
  tr.setAttribute('data-resource-id', resourceId)
}
