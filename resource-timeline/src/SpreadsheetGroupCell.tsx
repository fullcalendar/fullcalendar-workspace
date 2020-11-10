import { createElement, BaseComponent, Fragment, RenderHook } from '@fullcalendar/common'
import { ColSpec, ColCellContentArg } from '@fullcalendar/resource-common'

export interface SpreadsheetGroupCellProps {
  colSpec: ColSpec
  fieldValue: any
  rowSpan: number
}

// for VERTICAL cell grouping, in spreadsheet area
export class SpreadsheetGroupCell extends BaseComponent<SpreadsheetGroupCellProps> {
  render() {
    let { props, context } = this
    let { colSpec } = props
    let hookProps: ColCellContentArg = {
      groupValue: props.fieldValue,
      view: context.viewApi,
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <RenderHook<ColCellContentArg>
        hookProps={hookProps}
        classNames={colSpec.cellClassNames}
        content={colSpec.cellContent}
        defaultContent={renderGroupInner}
        didMount={colSpec.cellDidMount}
        willUnmount={colSpec.cellWillUnmount}
      >
        {(rootElRef, classNames, innerElRef, innerContent) => (
          // TODO: make data-attr with group value?
          <td className={['fc-datagrid-cell', 'fc-resource-group'].concat(classNames).join(' ')} rowSpan={props.rowSpan} ref={rootElRef}>
            <div className="fc-datagrid-cell-frame fc-datagrid-cell-frame-liquid">
              {/* ^needed for stickiness in some browsers */}
              <div className="fc-datagrid-cell-cushion fc-sticky" ref={innerElRef}>
                {innerContent}
              </div>
            </div>
          </td>
        )}
      </RenderHook>
    )
  }
}

function renderGroupInner(hookProps) {
  return hookProps.groupValue || <Fragment>&nbsp;</Fragment>
}
