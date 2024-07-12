import { BaseComponent } from '@fullcalendar/core/internal'
import { Fragment, createElement } from '@fullcalendar/core/preact'
import { ResourceHeaderCell, ResourceHeaderCellModel } from './ResourceHeaderCell.js'

export interface ResourceHeaderCellsProps {
  cells: ResourceHeaderCellModel[]
  colSpan: number
  colWidth: number | undefined
  isSticky?: boolean
}

export class ResourceHeaderCells extends BaseComponent<ResourceHeaderCellsProps> {
  render() {
    let { props } = this

    return (
      <Fragment>
        {props.cells.map((cell) => (
          <ResourceHeaderCell
            cell={cell}
            colSpan={props.colSpan}
            colWidth={props.colWidth}
            isSticky={props.isSticky}
          />
        ))}
      </Fragment>
    )
  }
}
