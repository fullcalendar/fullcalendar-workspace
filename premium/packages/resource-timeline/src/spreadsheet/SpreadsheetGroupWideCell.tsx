import { BaseComponent, ViewContext, ContentContainer } from '@fullcalendar/core/internal'
import { createElement, Fragment, createRef, RefObject, ComponentChild } from '@fullcalendar/core/preact'
import { ColCellContentArg } from '@fullcalendar/resource'
import { Group, createGroupId, isGroupsEqual } from '@fullcalendar/resource/internal'
import { ExpanderIcon } from '../ExpanderIcon.js'

export interface SpreadsheetGroupWideCellProps {
  isExpanded: boolean
  group: Group
  top: number | undefined
  height: number | undefined
  onNaturalHeight?: (height: number) => void
}

export class SpreadsheetGroupWideCell extends BaseComponent<SpreadsheetGroupWideCellProps, ViewContext> {
  innerElRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()

  render() {
    let { props, context } = this
    let renderProps: ColCellContentArg = { groupValue: props.group.value, view: context.viewApi }
    let spec = props.group.spec

    return ( // TODO: apply the top-coordinate
      <Fragment>
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
            <div className="fc-datagrid-cell-frame" style={{ height: props.height }}>
              <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner" ref={this.innerElRef}>
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
      </Fragment>
    )
  }

  onExpanderClick = () => {
    let { props } = this

    this.context.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: createGroupId(props.group),
      isExpanded: !props.isExpanded,
    })
  }

  componentDidMount(): void {
    this.reportNaturalHeight()
  }

  componentDidUpdate(): void {
    this.reportNaturalHeight()
  }

  reportNaturalHeight() {
    if (this.props.onNaturalHeight) {
      this.props.onNaturalHeight(this.innerElRef.current.offsetHeight)
    }
  }
}

SpreadsheetGroupWideCell.addPropsEquality({
  group: isGroupsEqual,
})

function renderCellInner(renderProps: ColCellContentArg): ComponentChild {
  return renderProps.groupValue || <Fragment>&nbsp;</Fragment>
}
