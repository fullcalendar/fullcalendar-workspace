import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { Group } from '@fullcalendar/resource/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { GroupTallCell } from './GroupTallCell.js'

export interface ResourceGroupCellsProps {
  colGroups: Group[]
  colGroupStats: { render: boolean, borderBottom: boolean }[] // TODO: type from createColGroupStats
  colWidths: number[]
}

export class ResourceGroupCells extends BaseComponent<ResourceGroupCellsProps> {
  render() {
    const { props } = this
    const { colGroups, colGroupStats, colWidths } = props

    return (
      <Fragment>
        {colGroups.map((colGroup, i) => {
          const stats = colGroupStats[i]
          const width = colWidths[i]
          const className = stats.borderBottom ? 'fc-border-b' : ''

          return (
            stats.render ? (
              <GroupTallCell
                colSpec={colGroup.spec}
                fieldValue={colGroup.value}
                className={className}
                width={width}
              />
            ) : (
              <div
                // TODO: make className DRY somehow?
                className={joinClassNames('fc-resource-group fc-cell', className)}
                style={{ width }}
              />
            )
          )
        })}
      </Fragment>
    )
  }
}
