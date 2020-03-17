import { h, Fragment, BaseComponent, ComponentContext, CssDimValue, createRef } from '@fullcalendar/core'
import { Group, isGroupsEqual } from '@fullcalendar/resource-common'
import ExpanderIcon from './ExpanderIcon'


export interface SpreadsheetGroupRowProps {
  spreadsheetColCnt: number
  id: string // 'field:value'
  isExpanded: boolean
  group: Group
  innerHeight: CssDimValue
  onRowHeight?: (innerEl: HTMLElement) => void // dumb name, dont need row in it
}


export default class SpreadsheetGroupRow extends BaseComponent<SpreadsheetGroupRowProps, ComponentContext> {

  innerInnerRef = createRef<HTMLDivElement>()


  render(props: SpreadsheetGroupRowProps, state: {}, context: ComponentContext) {
    let groupValue = props.group.value

    // TODO: add render hooks
    // console.log('groupValue', groupValue, props.group.spec.render)

    return (
      <tr>
        <td class={'fc-divider ' + context.theme.getClass('tableCellShaded')} colSpan={props.spreadsheetColCnt}>
          <div style={{ height: props.innerHeight }}>
            <div class='fc-cell-content' ref={this.innerInnerRef}>
              <ExpanderIcon
                depth={0}
                hasChildren={true}
                isExpanded={props.isExpanded}
                onExpanderClick={this.onExpanderClick}
              />
              <span class='fc-cell-text'>
                { groupValue || <Fragment>&nbsp;</Fragment> }
              </span>
            </div>
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


  componentDidMount() {
    this.transmitHeight()
  }


  componentDidUpdate() {
    this.transmitHeight()
  }


  componentWillUnmount() {
    if (this.props.onRowHeight) {
      this.props.onRowHeight(null)
    }
  }


  transmitHeight() {
    if (this.props.onRowHeight) {
      this.props.onRowHeight(this.innerInnerRef.current)
    }
  }

}

SpreadsheetGroupRow.addPropsEquality({
  group: isGroupsEqual
})
