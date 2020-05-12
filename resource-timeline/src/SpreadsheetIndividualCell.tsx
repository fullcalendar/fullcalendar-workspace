import { h, BaseComponent, ViewContext, CssDimValue, Fragment, MountHook, buildClassNameNormalizer, ContentHook, ViewApi, memoizeObjArg } from '@fullcalendar/common'
import { Resource, ColSpec, ResourceApi } from '@fullcalendar/resource-common'
import { ExpanderIcon } from './ExpanderIcon'


export interface SpreadsheetIndividualCellProps {
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  innerHeight: CssDimValue
}

export class SpreadsheetIndividualCell extends BaseComponent<SpreadsheetIndividualCellProps> { // worth making a PureComponent? (because of innerHeight)

  refineHookProps = memoizeObjArg(refineHookProps)
  normalizeClassNames = buildClassNameNormalizer<HookProps>()


  render() {
    let { props, context } = this
    let { colSpec } = props

    let hookProps = this.refineHookProps({
      resource: props.resource,
      fieldValue: props.fieldValue,
      context
    })
    let customClassNames = this.normalizeClassNames(colSpec.cellClassNames, hookProps)

    return (
      <MountHook hookProps={hookProps} didMount={colSpec.cellDidMount} willUnmount={colSpec.cellWillUnmount}>
        {(rootElRef) => (
          <td className={[ 'fc-datagrid-cell', 'fc-resource' ].concat(customClassNames).join(' ')} data-resource-id={props.resource.id} ref={rootElRef}>
            <div className='fc-datagrid-cell-frame' style={{ height: props.innerHeight }}>
              <div className='fc-datagrid-cell-cushion fc-scrollgrid-sync-inner'>
                {colSpec.isMain &&
                  <ExpanderIcon
                    depth={props.depth}
                    hasChildren={props.hasChildren}
                    isExpanded={props.isExpanded}
                    onExpanderClick={this.onExpanderClick}
                  />
                }
                <SpreadsheetIndividualCellInner hookProps={hookProps} colSpec={colSpec} />
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


interface SpreadsheetIndividualCellInnerProps {
  hookProps: HookProps
  colSpec: ColSpec
}

class SpreadsheetIndividualCellInner extends BaseComponent<SpreadsheetIndividualCellInnerProps> { // doesn't need context?

  render() {
    let { props } = this

    return (
      <ContentHook hookProps={props.hookProps} content={props.colSpec.cellContent} defaultContent={renderResourceInner}>
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


// hook props
// ----------

interface HookPropsInput {
  resource: Resource
  fieldValue: any
  context: ViewContext
}

interface HookProps {
  resource: ResourceApi
  fieldValue: any
  view: ViewApi
}

function refineHookProps(raw: HookPropsInput): HookProps {
  return {
    resource: new ResourceApi(raw.context, raw.resource),
    fieldValue: raw.fieldValue,
    view: raw.context.viewApi
  }
}
