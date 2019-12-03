import { h, VNode, Fragment } from '@fullcalendar/core'


/*
Renders the DOM responsible for the subrow expander area,
as well as the space before it (used to align expanders of similar depths)
*/
export default function ExpanderIcon({ depth, hasChildren, isExpanded, onExpanderClick }) {
  let nodes: VNode[] = []

  for (let i = 0; i < depth; i++) {
    nodes.push(
      <span class='fc-icon'></span>
    )
  }

  let iconClassNames = [ 'fc-icon' ]
  if (hasChildren) {
    if (isExpanded) {
      iconClassNames.push('fc-icon-minus-square')
    } else {
      iconClassNames.push('fc-icon-plus-square')
    }
  }

  nodes.push(
    <span
      class={'fc-expander-space' + (hasChildren ? ' fc-expander' : '')}
      onClick={onExpanderClick}
    >
      <span class={iconClassNames.join(' ')}></span>
    </span>
  )

  return (<Fragment>{nodes}</Fragment>)
}
