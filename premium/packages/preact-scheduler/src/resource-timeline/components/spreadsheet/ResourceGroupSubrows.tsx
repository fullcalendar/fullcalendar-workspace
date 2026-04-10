import { BaseComponent } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { Group } from '../../../resource/common/resource-hierarchy'
import { ResourceGroupSubrow } from './ResourceGroupSubrow'
import { joinClassNames } from '@fullcalendar/preact/public-api'

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
    const { props, context } = this
    const { options } = context
    const { colGroups, colGroupStats } = props

    const colWidths = props.colWidths || []
    const colGrows = props.colGrows || []

    return (
      <>
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
                  options.resourceRowClass,
                  stats.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
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
      </>
    )
  }
}
