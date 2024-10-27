import { BaseComponent, ViewContext, ContentContainer, watchHeight, setRef } from '@fullcalendar/core/internal'
import { createElement, Fragment, ComponentChild, Ref, createRef } from '@fullcalendar/core/preact'
import { ColCellContentArg } from '@fullcalendar/resource'
import { Group, createGroupId, isGroupsEqual } from '@fullcalendar/resource/internal'
import { ExpanderIcon } from './ExpanderIcon.js'

export interface GroupWideCellProps {
  group: Group
  isExpanded: boolean

  // refs
  innerHeightRef?: Ref<number>
}

export class GroupWideCell extends BaseComponent<GroupWideCellProps, ViewContext> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerHeight?: () => void

  render() {
    let { props, context } = this
    let renderProps: ColCellContentArg = { groupValue: props.group.value, view: context.viewApi }
    let spec = props.group.spec

    return ( // TODO: apply the top-coordinate
      <Fragment>
        <ContentContainer
          elTag="div"
          elAttrs={{
            // ARIA TODO: not really a columnheader
            // extremely tedious to make this aria-compliant,
            // to assign multiple headers to each cell
            // https://www.w3.org/WAI/tutorials/tables/multi-level/
            role: 'columnheader',
            scope: 'colgroup',
          }}
          // TODO: make part of fc-resource-group so ppl can style both cells together?
          elClassName='fc-resource-group fc-cell fc-liquid fc-shaded'
          renderProps={renderProps}
          generatorName="resourceGroupLabelContent"
          customGenerator={spec.labelContent}
          defaultGenerator={renderCellInner}
          classNameGenerator={spec.labelClassNames}
          didMount={spec.labelDidMount}
          willUnmount={spec.labelWillUnmount}
        >
          {(InnerContent) => (
            <div ref={this.innerElRef} className="fc-cell-inner fc-padding-lg fc-flex-row fc-align-center">
              <ExpanderIcon
                indent={0}
                hasChildren
                isExpanded={props.isExpanded}
                onExpanderClick={this.onExpanderClick}
              />
              <InnerContent
                elTag="span"
                elClassName='fc-cell-main'
              />
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
    const innerEl = this.innerElRef.current

    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight() // should fire a 'null' height? yes! will cleanup any map listeners
    setRef(this.props.innerHeightRef, null)
  }
}

GroupWideCell.addPropsEquality({
  group: isGroupsEqual,
})

function renderCellInner(renderProps: ColCellContentArg): ComponentChild {
  return renderProps.groupValue || <Fragment>&nbsp;</Fragment>
}
