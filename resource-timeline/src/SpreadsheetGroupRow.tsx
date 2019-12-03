import { h, Fragment, BaseComponent, ComponentContext } from '@fullcalendar/core'
import { Group, isGroupsEqual } from '@fullcalendar/resource-common'
import ExpanderIcon from './ExpanderIcon'


export interface SpreadsheetGroupRowProps {
  spreadsheetColCnt: number
  id: string // 'field:value'
  isExpanded: boolean
  group: Group
}

export default class SpreadsheetGroupRow extends BaseComponent<SpreadsheetGroupRowProps, ComponentContext> {


  render(props: SpreadsheetGroupRowProps) {
    let text = renderCellText(props.group)

    return (
      <tr>
        <td class='fc-divider' colSpan={props.spreadsheetColCnt}>
          <div class='fc-cell-content'>
            <ExpanderIcon
              depth={0}
              hasChildren={true}
              isExpanded={props.isExpanded}
              onExpanderClick={this.onExpanderClick}
            />
            <span class='fc-cell-text'>
              { text || <Fragment>&nbsp;</Fragment> }
            </span>
          </div>
        </td>
      </tr>
    )
  }


  onExpanderClick = () => {
    let { props } = this

    this.context.calendar.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: props.id,
      isExpanded: !props.isExpanded
    })
  }

}

SpreadsheetGroupRow.addPropsEquality({
  group: isGroupsEqual
})


function renderCellText(group: Group) {
  let text = group.value || '' // might be null/undefined if an ad-hoc grouping
  let filter = group.spec.text

  if (typeof filter === 'function') {
    text = filter(text) || text
  }

  return text
}
