import { BaseComponent, ViewContext } from '@fullcalendar/core/internal'
import { Fragment, createElement } from '@fullcalendar/core/preact'
import { Resource, ColSpec, getPublicId } from '@fullcalendar/resource/internal'
import { SpreadsheetResourceCell } from './SpreadsheetResourceCell.js'

export interface SpreadsheetResourceCellsProps {
  resource: Resource
  resourceFields: any
  colSpecs: ColSpec[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
}

export class SpreadsheetResourceCells extends BaseComponent<SpreadsheetResourceCellsProps, ViewContext> {
  render() {
    let { props } = this
    let { resource, resourceFields } = props

    return (
      <Fragment>
        {props.colSpecs.map((colSpec, i) => {
          let fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          return (
            <SpreadsheetResourceCell
              key={i} // eslint-disable-line react/no-array-index-key
              colSpec={colSpec}
              resource={resource}
              fieldValue={fieldValue}
              depth={props.depth}
              hasChildren={props.hasChildren}
              isExpanded={props.isExpanded}
            />
          )
        })}
      </Fragment>
    )
  }
}
