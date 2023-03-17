import { CssDimValue } from '@fullcalendar/core'
import { BaseComponent, ViewContext, ContentContainer } from '@fullcalendar/core/internal'
import { createElement, Fragment, createRef, RefObject, ComponentChild } from '@fullcalendar/core/preact'
import { ColCellContentArg } from '@fullcalendar/resource'
import { Group, isGroupsEqual } from '@fullcalendar/resource/internal'
import { ExpanderIcon } from './ExpanderIcon.js'

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
    let renderProps: ColCellContentArg = { groupValue: props.group.value, view: context.viewApi }
    let spec = props.group.spec

    return (
      <tr role="row">
        <ContentContainer
          elTag="th"
          elClasses={[
            'fc-datagrid-cell',
            'fc-resource-group',
            context.theme.getClass('tableCellShaded'),
          ]}
          elAttrs={{
            // ARIA TODO: not really a columnheader
            // extremely tedious to make this aria-compliant,
            // to assign multiple headers to each cell
            // https://www.w3.org/WAI/tutorials/tables/multi-level/
            role: 'columnheader',
            scope: 'colgroup',
            colSpan: props.spreadsheetColCnt,
          }}
          renderProps={renderProps}
          generatorName="resourceGroupLabelContent"
          customGenerator={spec.labelContent}
          defaultGenerator={renderCellInner}
          classNameGenerator={spec.labelClassNames}
          didMount={spec.labelDidMount}
          willUnmount={spec.labelWillUnmount}
        >
          {(InnerContent) => (
            <div className="fc-datagrid-cell-frame" style={{ height: props.innerHeight }}>
              <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner" ref={this.innerInnerRef}>
                <ExpanderIcon
                  depth={0}
                  hasChildren
                  isExpanded={props.isExpanded}
                  onExpanderClick={this.onExpanderClick}
                />
                <InnerContent
                  elTag="span"
                  elClasses={['fc-datagrid-cell-main']}
                />
              </div>
            </div>
          )}
        </ContentContainer>
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

function renderCellInner(renderProps: ColCellContentArg): ComponentChild {
  return renderProps.groupValue || <Fragment>&nbsp;</Fragment>
}
