import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { ComponentChild, createElement, Fragment } from '@fullcalendar/core/preact'
import { ColSpec, ColCellContentArg } from '@fullcalendar/resource'

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
    let renderProps: ColCellContentArg = {
      groupValue: props.fieldValue,
      view: context.viewApi,
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <ContentContainer
        elTag="td"
        elClasses={[
          'fc-datagrid-cell',
          'fc-resource-group',
        ]}
        elAttrs={{
          role: 'gridcell',
          rowSpan: props.rowSpan,
        }}
        renderProps={renderProps}
        generatorName="resourceGroupLabelContent"
        generator={colSpec.cellContent || renderGroupInner}
        classNameGenerator={colSpec.cellClassNames}
        didMount={colSpec.cellDidMount}
        willUnmount={colSpec.cellWillUnmount}
      >
        {(InnerContent) => (
          <div className="fc-datagrid-cell-frame fc-datagrid-cell-frame-liquid">
            <InnerContent
              elTag="div"
              elClasses={['fc-datagrid-cell-cushion', 'fc-sticky']}
            />
          </div>
        )}
      </ContentContainer>
    )
  }
}

function renderGroupInner(renderProps: ColCellContentArg): ComponentChild {
  return renderProps.groupValue || <Fragment>&nbsp;</Fragment>
}
