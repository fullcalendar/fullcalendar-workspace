import { CssDimValue } from '@fullcalendar/core'
import { BaseComponent, ViewContext, isArraysEqual } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { Resource, buildResourceFields, ColSpec, getPublicId } from '@fullcalendar/resource/internal'
import { SpreadsheetIndividualCell } from './SpreadsheetIndividualCell.js'
import { SpreadsheetGroupCell } from './SpreadsheetGroupCell.js'

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
      <tr role="row">
        {props.colSpecs.map((colSpec, i) => {
          let rowSpan = rowSpans[i]

          if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
            return null
          }

          if (rowSpan == null) {
            rowSpan = 1
          }

          let fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          if (rowSpan > 1) {
            return (
              <SpreadsheetGroupCell
                key={i} // eslint-disable-line react/no-array-index-key
                colSpec={colSpec}
                fieldValue={fieldValue}
                rowSpan={rowSpan}
              />
            )
          }

          return (
            <SpreadsheetIndividualCell
              key={i} // eslint-disable-line react/no-array-index-key
              colSpec={colSpec}
              resource={resource}
              fieldValue={fieldValue}
              depth={depth}
              hasChildren={props.hasChildren}
              isExpanded={props.isExpanded}
              innerHeight={props.innerHeight}
            />
          )
        })}
      </tr>
    )
  }
}

SpreadsheetRow.addPropsEquality({
  rowSpans: isArraysEqual,
})
