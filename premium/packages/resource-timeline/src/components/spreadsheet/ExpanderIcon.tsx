import { joinClassNames } from '@fullcalendar/core/internal'
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
    nodes.push(
      <span
        className={joinClassNames(
          'fc-datagrid-expander fc-icon',
          isExpanded
            ? 'fc-icon-minus-square'
            : 'fc-icon-plus-square'
        )}
        onClick={onExpanderClick}
      />,
    )
  }

  return (
    <div className='fc-datagrid-indent'>
      {...nodes}
    </div>
  )
}
