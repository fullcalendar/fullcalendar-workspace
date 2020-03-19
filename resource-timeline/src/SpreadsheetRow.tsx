import {
  h, BaseComponent, ComponentContext, isArraysEqual, CssDimValue, createRef, Fragment, RenderHook
} from '@fullcalendar/core'
import { Resource, buildResourceFields, ColSpec, ResourceApi, getPublicId } from '@fullcalendar/resource-common'
import ExpanderIcon from './ExpanderIcon'


export interface SpreadsheetRowProps {
  colSpecs: ColSpec[]
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
  innerHeight: CssDimValue // bad name! inner vs innerinner
  onRowHeight?: (innerEl: HTMLElement | null) => void
}


export default class SpreadsheetRow extends BaseComponent<SpreadsheetRowProps, ComponentContext> {

  innerInnerRef = createRef<HTMLDivElement>()


  render(props: SpreadsheetRowProps, state: {}, context: ComponentContext) {
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
            let innerProps = {
              groupValue: fieldValue,
              view: context.view
            }

            // a grouped cell. no data that is specific to this specific resource
            // `colSpec` is for the group. a GroupSpec :(
            return (
              <RenderHook name='cell' options={colSpec} mountProps={innerProps} dynamicProps={innerProps} defaultInnerContent={renderGroupInner}>
                {(rootElRef, classNames, innerElRef, innerContent) => (
                  // TODO: make data-attr with group value?
                  <td className={[ 'fc-datagrid-cell', 'fc-datagrid-group' ].concat(classNames).join(' ')} rowSpan={rowSpan} ref={rootElRef}>
                    <div class='vgrow'> {/* needed for stickiness in some browsers */}
                      <div class='fc-datagrid-cell-inner fc-sticky' ref={innerElRef}>
                        {innerContent}
                      </div>
                    </div>
                  </td>
                )}
              </RenderHook>
            )

          } else {
            let innerProps = {
              resource: new ResourceApi(context.calendar, resource),
              fieldValue,
              view: context.view
            }

            return (
              <RenderHook name='cell' options={colSpec} mountProps={innerProps} dynamicProps={innerProps} defaultInnerContent={renderResourceInner}>
                {(rootElRef, classNames, innerElRef, innerContent) => (
                  <td className={[ 'fc-datagrid-cell', 'fc-datagrid-resource' ].concat(classNames).join(' ')} data-resource-id={resource.id} rowSpan={rowSpan} ref={rootElRef}>
                    <div style={{ height: props.innerHeight }}>
                      <div class='fc-datagrid-cell-inner' ref={this.innerInnerRef}>
                        { colSpec.isMain &&
                          <ExpanderIcon
                            depth={depth}
                            hasChildren={props.hasChildren}
                            isExpanded={props.isExpanded}
                            onExpanderClick={this.onExpanderClick}
                          />
                        }
                        <span ref={innerElRef}>
                          {innerContent}
                        </span>
                      </div>
                    </div>
                  </td>
                )}
              </RenderHook>
            )
          }
        })}
      </tr>
    )
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


  onExpanderClick = (ev: UIEvent) => {
    let { props } = this

    if (props.hasChildren) {
      this.context.calendar.dispatch({
        type: 'SET_RESOURCE_ENTITY_EXPANDED',
        id: props.resource.id,
        isExpanded: !props.isExpanded
      })
    }
  }

}

SpreadsheetRow.addPropsEquality({
  rowSpans: isArraysEqual
})


function renderGroupInner(innerProps) {
  return innerProps.groupValue || <Fragment>&nbsp;</Fragment>
}


function renderResourceInner(innerProps) {
  return innerProps.fieldValue || <Fragment>&nbsp;</Fragment>
}
