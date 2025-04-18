import { BaseComponent, Icon } from '@fullcalendar/core/internal'
import { createElement, VNode, Fragment } from '@fullcalendar/core/preact'

/*
Renders the DOM responsible for the subrow expander area,
as well as the space before it (used to align expanders of similar depths)
*/

export interface ExpanderIconProps {
  indent: number
  hasChildren: boolean
  isExpanded: boolean
  onExpanderClick: any // TODO
}

export class ExpanderIcon extends BaseComponent<ExpanderIconProps> {
  render() {
    const { indent, hasChildren, isExpanded, onExpanderClick } = this.props
    const iconInputs = this.context.options.icons || {}

    if (!indent && !hasChildren) {
      return <Fragment />
    }

    let nodes: VNode[] = []
    let emptyIconCnt = indent - (hasChildren ? 1 : 0)

    for (let i = 0; i < emptyIconCnt; i += 1) {
      nodes.push(
        <span className="fc-datagrid-icon" />,
      )
    }

    if (hasChildren) {
      nodes.push(
        <span
          aria-hidden // TODO: better a11y when doing roving tabindex
          className='fc-datagrid-icon-expander fc-datagrid-icon'
          onClick={onExpanderClick}
        >
          <Icon input={isExpanded ? iconInputs.collapse : iconInputs.expand} />
        </span>,
      )
    }

    return (
      <div className='fc-datagrid-indent'>
        {...nodes}
      </div>
    )
  }
}
