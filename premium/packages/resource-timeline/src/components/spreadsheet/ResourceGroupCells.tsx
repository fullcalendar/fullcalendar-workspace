import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { Group } from '@fullcalendar/resource/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { GroupTallCell } from './GroupTallCell.js'

export interface ResourceGroupCellsProps {
  colGroups: Group[]
  colGroupStats: { render: boolean, borderBottom: boolean }[] // TODO: type from createColGroupStats
  colWidthConfigs: { pixels: number, grow: number }[]
}

export class ResourceGroupCells extends BaseComponent<ResourceGroupCellsProps> {
  render() {
    const { props } = this
    const { colGroups, colGroupStats, colWidthConfigs } = props

    return (
      <Fragment>
        {colGroups.map((colGroup, i) => {
          const stats = colGroupStats[i]
          const widthConfig = colWidthConfigs[i]
          const className = stats.borderBottom ? 'fc-border-b' : ''

          return (
            stats.render ? (
              <GroupTallCell
                colSpec={colGroup.spec}
                fieldValue={colGroup.value}
                className={className}
                widthConfig={widthConfig}
              />
            ) : (
              <div
                // TODO: make className DRY somehow?
                className={joinClassNames('fc-resource-group fc-cell', className)}
                style={{
                  minWidth: 0,
                  width: widthConfig.pixels,
                  flexGrow: widthConfig.grow,
                }}
              />
            )
          )
        })}
      </Fragment>
    )
  }
}
