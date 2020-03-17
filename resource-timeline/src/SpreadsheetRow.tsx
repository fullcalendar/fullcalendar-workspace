import {
  h, BaseComponent, ComponentContext, isArraysEqual, CssDimValue, createRef, Fragment
} from '@fullcalendar/core'
import { Resource, buildResourceFields, ColSpec } from '@fullcalendar/resource-common'
import ExpanderIcon from './ExpanderIcon'
import { getPublicId } from 'packages-premium/resource-common/src/structs/resource'


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
      <tr data-resource-id={resource.id}>
        {props.colSpecs.map((colSpec, i) => {
          let rowSpan = rowSpans[i]

          if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
            return
          } else if (rowSpan == null) {
            rowSpan = 1
          }


          let fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          // TODO: add render hooks
          // console.log('fieldValue', fieldValue, colSpec.render)

          if (rowSpan > 1) {

            // a grouped cell. no data that is specific to this specific resource
            return (
              <td rowSpan={rowSpan}>
                <div class='vgrow'> {/* needed for stickiness in some browsers */}
                  <div class='fc-cell-content fc-sticky'>
                    <span class='fc-cell-text'> {/* can we get rid of fc-cell-text class? */}
                      {fieldValue}
                    </span>
                  </div>
                </div>
              </td>
            )

          } else {
            return (
              <td rowSpan={rowSpan}>
                <div style={{ height: props.innerHeight }}>
                  <div class='fc-cell-content' ref={this.innerInnerRef}>
                    { colSpec.isMain &&
                      <ExpanderIcon
                        depth={depth}
                        hasChildren={props.hasChildren}
                        isExpanded={props.isExpanded}
                        onExpanderClick={this.onExpanderClick}
                      />
                    }
                    <span class='fc-cell-text'>
                      {fieldValue || <Fragment>&nbsp;</Fragment>}
                    </span>
                  </div>
                </div>
              </td>
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
