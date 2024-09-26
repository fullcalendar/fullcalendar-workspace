import { createElement, VNode, Fragment } from '@fullcalendar/core/preact'

/*
Renders the DOM responsible for the subrow expander area,
as well as the space before it (used to align expanders of similar depths)
*/
export function ExpanderIcon({ indent, hasChildren, isExpanded, onExpanderClick }): VNode {
  if (!indent && !hasChildren) {
    return <Fragment />
  }

  let nodes: VNode[] = []
  let emptyIconCnt = indent - (hasChildren ? 1 : 0)

  for (let i = 0; i < emptyIconCnt; i += 1) {
    nodes.push(
      <span className="fc-icon" />,
    )
  }

  if (hasChildren) {
    let iconClassNames = ['fc-datagrid-expander', 'fc-icon']

    if (isExpanded) {
      iconClassNames.push('fc-icon-minus-square')
    } else {
      iconClassNames.push('fc-icon-plus-square')
    }

    nodes.push(
       <span className={iconClassNames.join(' ')} onClick={onExpanderClick}/>,
    )
  }

  return (
    <span className='fc-datagrid-indent'>
      {...nodes}
    </span>
  )
}
