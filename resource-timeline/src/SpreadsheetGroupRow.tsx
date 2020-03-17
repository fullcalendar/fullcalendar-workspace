import { h, Fragment, BaseComponent, ComponentContext, CssDimValue, createRef, RenderHook } from '@fullcalendar/core'
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
    let innerProps = {
      groupValue: props.group.value
    }

    return (
      <tr>
        <RenderHook name='label' options={props.group.spec} mountProps={innerProps} dynamicProps={innerProps} defaultInnerContent={renderCellInner}>
          {(rootElRef, classNames, innerElRef, innerContent) => (
            <td ref={rootElRef} class={[ 'fc-divider', context.theme.getClass('tableCellShaded') ].concat(classNames).join(' ')} colSpan={props.spreadsheetColCnt}>
              <div style={{ height: props.innerHeight }}>
                <div class='fc-cell-content' ref={this.innerInnerRef}>
                  <ExpanderIcon
                    depth={0}
                    hasChildren={true}
                    isExpanded={props.isExpanded}
                    onExpanderClick={this.onExpanderClick}
                  />
                  <span class='fc-cell-text' ref={innerElRef}>
                    {innerContent}
                  </span>
                </div>
              </div>
            </td>
          )}
        </RenderHook>
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


function renderCellInner(innerProps) {
  return innerProps.groupValue || <Fragment>&nbsp;</Fragment>
}
