import { BaseComponent } from '@fullcalendar/core/internal'
import { Group } from '@fullcalendar/resource/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { GroupTallCell } from './GroupTallCell.js'

export interface ResourceGroupCellsProps {
  colGroups: Group[]
  colGroupIndexes: number[]
  colWidths: number[]
}

export class ResourceGroupCells extends BaseComponent<ResourceGroupCellsProps> {
  render() {
    const { props } = this
    const { colGroups, colGroupIndexes, colWidths } = props // TODO: colGroupIndexes

    return (
      <Fragment>
        {colGroups.map((group, i) => (
          !colGroupIndexes[i] ? (
            <GroupTallCell
              colSpec={group.spec}
              fieldValue={group.value}
              width={colWidths[i]}
            />
          ) : (
            <div style={{ width: colWidths[i] }}></div>
          )
        ))}
      </Fragment>
    )
  }
}
