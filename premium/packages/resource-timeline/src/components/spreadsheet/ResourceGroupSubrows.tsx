import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { Group } from '@fullcalendar/resource/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { ResourceGroupSubrow } from './ResourceGroupSubrow.js'

export interface ResourceGroupSubrowsProps {
  colGroups: Group[]
  colGroupStats: { render: boolean, borderBottom: boolean }[] // TODO: type from createColGroupStats
  colWidths: number[] | undefined
  colGrows?: number[]
}

/*
Just for print
*/
export class ResourceGroupSubrows extends BaseComponent<ResourceGroupSubrowsProps> {
  render() {
    const { props } = this
    const { colGroups, colGroupStats } = props

    const colWidths = props.colWidths || []
    const colGrows = props.colGrows || []

    return (
      <Fragment>
        {colGroups.map((colGroup, i) => {
          const stats = colGroupStats[i]

          return (
            stats.render ? (
              <ResourceGroupSubrow
                colSpec={colGroup.spec}
                fieldValue={colGroup.value}
                width={colWidths[i]}
                grow={colGrows[i]}
                borderStart={Boolean(i)}
                borderBottom={stats.borderBottom}
              />
            ) : (
              <div
                // TODO: make className DRY somehow?
                className={joinClassNames(
                  'fc-resource-group',
                  stats.borderBottom ? 'fcu-border-only-b' : 'fcu-border-none'
                )}
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
