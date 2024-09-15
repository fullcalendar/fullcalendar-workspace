import { createElement, VNode, Fragment } from '@fullcalendar/core/preact'

/*
Renders the DOM responsible for the subrow expander area,
as well as the space before it (used to align expanders of similar depths)
*/
export function ExpanderIcon({ indent, hasChildren, isExpanded, onExpanderClick }): VNode {
  let nodes: VNode[] = []

  for (let i = 0; i < indent; i += 1) {
    nodes.push(
      <span className="fcnew-icon" />,
    )
  }

  let iconClassNames = ['fcnew-icon']
  if (hasChildren) {
    if (isExpanded) {
      iconClassNames.push('fcnew-icon-minus-square')
    } else {
      iconClassNames.push('fcnew-icon-plus-square')
    }
  }

  nodes.push(
    <span
      className={'fcnew-datagrid-expander' + (hasChildren ? '' : ' fcnew-datagrid-expander-placeholder')}
      onClick={onExpanderClick}
    >
      <span className={iconClassNames.join(' ')} />
    </span>,
  )

  return createElement(Fragment, {}, ...nodes)
}
