import {
  createElement, BaseComponent, CssDimValue, MountHook,
  buildClassNameNormalizer, memoizeObjArg,
} from '@fullcalendar/common'
import { Resource, ColSpec } from '@fullcalendar/resource-common'
import { ExpanderIcon } from './ExpanderIcon'
import { refineHookProps, HookProps } from './spreadsheet-cell-util'
import { SpreadsheetIndividualCellInner } from './SpreadsheetIndividualCellInner'

export interface SpreadsheetIndividualCellProps {
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  innerHeight: CssDimValue
}

// worth making a PureComponent? (because of innerHeight)
export class SpreadsheetIndividualCell extends BaseComponent<SpreadsheetIndividualCellProps> {
  refineHookProps = memoizeObjArg(refineHookProps)
  normalizeClassNames = buildClassNameNormalizer<HookProps>()

  render() {
    let { props, context } = this
    let { colSpec } = props

    let hookProps = this.refineHookProps({
      resource: props.resource,
      fieldValue: props.fieldValue,
      context,
    })
    let customClassNames = this.normalizeClassNames(colSpec.cellClassNames, hookProps)

    return (
      <MountHook hookProps={hookProps} didMount={colSpec.cellDidMount} willUnmount={colSpec.cellWillUnmount}>
        {(rootElRef) => (
          <td
            ref={rootElRef}
            data-resource-id={props.resource.id}
            className={[
              'fc-datagrid-cell',
              'fc-resource',
            ].concat(customClassNames).join(' ')}
          >
            <div className="fc-datagrid-cell-frame" style={{ height: props.innerHeight }}>
              <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner">
                {colSpec.isMain && (
                  <ExpanderIcon
                    depth={props.depth}
                    hasChildren={props.hasChildren}
                    isExpanded={props.isExpanded}
                    onExpanderClick={this.onExpanderClick}
                  />
                )}
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
        isExpanded: !props.isExpanded,
      })
    }
  }
}
