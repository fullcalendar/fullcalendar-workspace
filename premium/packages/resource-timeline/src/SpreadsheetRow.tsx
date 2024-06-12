import { BaseComponent, ViewContext, isArraysEqual } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { Resource, buildResourceFields, ColSpec, getPublicId } from '@fullcalendar/resource/internal'
import { SpreadsheetIndividualCell } from './SpreadsheetIndividualCell.js'

export interface SpreadsheetRowProps {
  colSpecs: ColSpec[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
  top: number | undefined
  height: number | undefined
}

/*
TODO: Rename to SpreadsheetResourceRow
*/
export class SpreadsheetRow extends BaseComponent<SpreadsheetRowProps, ViewContext> {
  render() {
    let { props } = this
    let { resource, depth } = props
    let resourceFields = buildResourceFields(resource) // slightly inefficient. already done up the call stack

    return (
      <tr role="row">
        {props.colSpecs.map((colSpec, i) => {
          let fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          return (
            <SpreadsheetIndividualCell
              key={i} // eslint-disable-line react/no-array-index-key
              colSpec={colSpec}
              resource={resource}
              fieldValue={fieldValue}
              depth={depth}
              hasChildren={props.hasChildren}
              isExpanded={props.isExpanded}
              height={props.height}
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
