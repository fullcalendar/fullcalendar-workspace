import { createElement, Fragment, BaseComponent, ViewContext, CssDimValue, createRef, RenderHook, RefObject } from '@fullcalendar/common'
import { Group, isGroupsEqual, ColCellContentArg } from '@fullcalendar/resource-common'
import { ExpanderIcon } from './ExpanderIcon'

export interface SpreadsheetGroupRowProps {
  spreadsheetColCnt: number
  id: string // 'field:value'
  isExpanded: boolean
  group: Group
  innerHeight: CssDimValue
}

// for HORIZONTAL cell grouping, in spreadsheet area
export class SpreadsheetGroupRow extends BaseComponent<SpreadsheetGroupRowProps, ViewContext> {
  innerInnerRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()

  render() {
    let { props, context } = this
    let hookProps: ColCellContentArg = { groupValue: props.group.value, view: context.viewApi }
    let spec = props.group.spec

    return (
      <tr role="row">
        <RenderHook<ColCellContentArg>
          hookProps={hookProps}
          classNames={spec.labelClassNames}
          content={spec.labelContent}
          defaultContent={renderCellInner}
          didMount={spec.labelDidMount}
          willUnmount={spec.labelWillUnmount}
        >
          {(rootElRef, classNames, innerElRef, innerContent) => (
            <th
              ref={rootElRef}
              // ARIA TODO: not really a columnheader
              // extremely tedious to make this aria-compliant,
              // to assign multiple headers to each cell
              // https://www.w3.org/WAI/tutorials/tables/multi-level/
              role="columnheader"
              scope="colgroup"
              colSpan={props.spreadsheetColCnt}
              className={
                [
                  'fc-datagrid-cell',
                  'fc-resource-group',
                  context.theme.getClass('tableCellShaded'),
                ].concat(classNames).join(' ')
              }
            >
              <div className="fc-datagrid-cell-frame" style={{ height: props.innerHeight }}>
                <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner" ref={this.innerInnerRef}>
                  <ExpanderIcon
                    depth={0}
                    hasChildren
                    isExpanded={props.isExpanded}
                    onExpanderClick={this.onExpanderClick}
                  />
                  <span className="fc-datagrid-cell-main" ref={innerElRef}>
                    {innerContent}
                  </span>
                </div>
              </div>
            </th>
          )}
        </RenderHook>
      </tr>
    )
  }

  onExpanderClick = () => {
    let { props } = this

    this.context.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: props.id,
      isExpanded: !props.isExpanded,
    })
  }
}

SpreadsheetGroupRow.addPropsEquality({
  group: isGroupsEqual,
})

function renderCellInner(hookProps) {
  return hookProps.groupValue || <Fragment>&nbsp;</Fragment>
}
