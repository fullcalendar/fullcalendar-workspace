import {
  h, BaseComponent, ComponentContext, isArraysEqual, CssDimValue, Fragment, RenderHook, MountHook, buildHookClassNameGenerator, ContentHook, ViewApi
} from '@fullcalendar/common'
import { Resource, buildResourceFields, ColSpec, ResourceApi, getPublicId } from '@fullcalendar/resource-common'
import { ExpanderIcon } from './ExpanderIcon'


export interface SpreadsheetRowProps {
  colSpecs: ColSpec[]
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
  innerHeight: CssDimValue // bad name! inner vs innerinner
}


export class SpreadsheetRow extends BaseComponent<SpreadsheetRowProps, ComponentContext> {

  render() {
    let { props } = this
    let { resource, rowSpans, depth } = props
    let resourceFields = buildResourceFields(resource) // slightly inefficient. already done up the call stack

    return (
      <tr>
        {props.colSpecs.map((colSpec, i) => {
          let rowSpan = rowSpans[i]

          if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
            return
          } else if (rowSpan == null) {
            rowSpan = 1
          }

          let fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          if (rowSpan > 1) {
            return (
              <SpreadsheetGroupCell
                colSpec={colSpec}
                fieldValue={fieldValue}
                rowSpan={rowSpan}
              />
            )

          } else {
            return (
              <SpreadsheetIndividualCell
                colSpec={colSpec}
                resource={resource}
                fieldValue={fieldValue}
                depth={depth}
                hasChildren={props.hasChildren}
                isExpanded={props.isExpanded}
                innerHeight={props.innerHeight}
              />
            )
          }
        })}
      </tr>
    )
  }

}

SpreadsheetRow.addPropsEquality({
  rowSpans: isArraysEqual
})



interface SpreadsheetGroupCellProps {
  colSpec: ColSpec
  fieldValue: any
  rowSpan: number
}

class SpreadsheetGroupCell extends BaseComponent<SpreadsheetGroupCellProps> {

  render() {
    let { props, context } = this
    let hookProps = {
      groupValue: props.fieldValue,
      view: context.viewApi
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <RenderHook name='cell' options={props.colSpec} hookProps={hookProps} defaultContent={renderGroupInner}>
        {(rootElRef, classNames, innerElRef, innerContent) => (
          // TODO: make data-attr with group value?
          <td className={[ 'fc-datagrid-cell', 'fc-resource-group' ].concat(classNames).join(' ')} rowSpan={props.rowSpan} ref={rootElRef}>
            <div className='fc-datagrid-cell-frame fc-datagrid-cell-frame-liquid'> {/* needed for stickiness in some browsers */}
              <div className='fc-datagrid-cell-cushion fc-sticky' ref={innerElRef}>
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



interface SpreadsheetIndividualCellProps {
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  innerHeight: CssDimValue
}

class SpreadsheetIndividualCell extends BaseComponent<SpreadsheetIndividualCellProps> { // worth making a PureComponent? (because of innerHeight)

  buildClassNames = buildHookClassNameGenerator('cell')

  render() {
    let { props, context } = this

    let hookPropOrigin: HookPropOrigin = {
      resource: props.resource,
      fieldValue: props.fieldValue
    }
    let hookProps = massageHookProps(hookPropOrigin, context)
    let customClassNames = this.buildClassNames(hookProps, context, props.colSpec, hookPropOrigin)

    return (
      <MountHook name='cell' hookProps={hookProps} options={props.colSpec}>
        {(rootElRef) => (
          <td className={[ 'fc-datagrid-cell', 'fc-resource' ].concat(customClassNames).join(' ')} data-resource-id={props.resource.id} ref={rootElRef}>
            <div className='fc-datagrid-cell-frame' style={{ height: props.innerHeight }}>
              <div className='fc-datagrid-cell-cushion fc-scrollgrid-sync-inner'>
                { props.colSpec.isMain &&
                  <ExpanderIcon
                    depth={props.depth}
                    hasChildren={props.hasChildren}
                    isExpanded={props.isExpanded}
                    onExpanderClick={this.onExpanderClick}
                  />
                }
                <SpreadsheetIndividualCellInner {...hookPropOrigin} colSpec={props.colSpec} />
              </div>
            </div>
          </td>
        )}
      </MountHook>
    )
  }

  onExpanderClick = (ev: UIEvent) => {
    let { props } = this

    if (props.hasChildren) {
      this.context.dispatch({
        type: 'SET_RESOURCE_ENTITY_EXPANDED',
        id: props.resource.id,
        isExpanded: !props.isExpanded
      })
    }
  }

}



interface SpreadsheetIndividualCellInnerProps extends HookPropOrigin {
  colSpec: ColSpec
}

class SpreadsheetIndividualCellInner extends BaseComponent<SpreadsheetIndividualCellInnerProps> {

  render() {
    let { props, context } = this
    let hookProps = massageHookProps(props, context)

    return (
      <ContentHook name='cell' hookProps={hookProps} options={props.colSpec} defaultContent={renderResourceInner}>
        {(innerElRef, innerContent) => (
          <span className='fc-datagrid-cell-main' ref={innerElRef}>
            {innerContent}
          </span>
        )}
      </ContentHook>
    )
  }

}

function renderResourceInner(hookProps) {
  return hookProps.fieldValue || <Fragment>&nbsp;</Fragment>
}



interface HookProps {
  resource: ResourceApi
  fieldValue: any
  view: ViewApi
}

interface HookPropOrigin {
  resource: Resource
  fieldValue: any
}

function massageHookProps(input: HookPropOrigin, context: ComponentContext): HookProps {
  return {
    resource: new ResourceApi(context, input.resource),
    fieldValue: input.fieldValue,
    view: context.viewApi
  }
}
