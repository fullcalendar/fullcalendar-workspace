import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { Group } from '@fullcalendar/resource/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { GroupTallCell } from './GroupTallCell.js'

export interface ResourceGroupCellsProps {
  colGroups: Group[]
  colGroupStats: { render: boolean, borderBottom: boolean }[] // TODO: type from createColGroupStats
  colWidths: number[] | undefined
  colGrows?: number[]
}

export class ResourceGroupCells extends BaseComponent<ResourceGroupCellsProps> {
  render() {
    const { props } = this
    const { colGroups, colGroupStats } = props

    const colWidths = props.colWidths || []
    const colGrows = props.colGrows || []

    return (
      <Fragment>
        {colGroups.map((colGroup, i) => {
          const stats = colGroupStats[i]
          const className = stats.borderBottom ? 'fc-border-b' : ''

          return (
            stats.render ? (
              <GroupTallCell
                colSpec={colGroup.spec}
                fieldValue={colGroup.value}
                className={className}
                width={colWidths[i]}
                grow={colGrows[i]}
              />
            ) : (
              <div
                // TODO: make className DRY somehow?
                className={joinClassNames('fc-resource-group fc-cell', className)}
                style={{
                  minWidth: 0,
                  width: colWidths[i],
                  flexGrow: colGrows[i],
                }}
              />
            )
          )
        })}
      </Fragment>
    )
  }
}
