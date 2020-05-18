import { h, BaseComponent, ViewContext, isArraysEqual, CssDimValue } from '@fullcalendar/common'
import { Resource, buildResourceFields, ColSpec, getPublicId } from '@fullcalendar/resource-common'
import { SpreadsheetIndividualCell } from './SpreadsheetIndividualCell'
import { SpreadsheetGroupCell } from './SpreadsheetGroupCell'


export interface SpreadsheetRowProps {
  colSpecs: ColSpec[]
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
  innerHeight: CssDimValue // bad name! inner vs innerinner
}


export class SpreadsheetRow extends BaseComponent<SpreadsheetRowProps, ViewContext> {

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
                key={i}
                colSpec={colSpec}
                fieldValue={fieldValue}
                rowSpan={rowSpan}
              />
            )

          } else {
            return (
              <SpreadsheetIndividualCell
                key={i}
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
