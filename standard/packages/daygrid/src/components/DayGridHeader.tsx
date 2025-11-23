import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayGridHeaderRow } from './DayGridHeaderRow.js'
import { RowConfig } from '../header-tier.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface DayGridHeaderProps {
  headerTiers: RowConfig<{ text: string, isDisabled: boolean }>[]
  className?: string
  cellIsNarrow: boolean
  cellIsMicro: boolean

  // dimensions
  width?: number
  colWidth?: number
}

/*
TODO: kill this class in favor of DayGridHeaderRows?
*/
export class DayGridHeader extends BaseComponent<DayGridHeaderProps> {
  render() {
    const { props } = this
    const { headerTiers } = props

    return (
      <div
        role='rowgroup'
        className={joinClassNames(
          props.className,
          classNames.flexCol,
          props.width == null && classNames.liquid,
        )}
        style={{
          width: props.width,
        }}
      >
        {headerTiers.map((rowConfig, i) => (
          <DayGridHeaderRow
            {...rowConfig}
            key={i}
            role='row'
            borderBottom={i < headerTiers.length - 1}
            colWidth={props.colWidth}
            cellIsNarrow={props.cellIsNarrow}
            cellIsMicro={props.cellIsMicro}
            rowLevel={headerTiers.length - i - 1}
          />
        ))}
      </div>
    )
  }
}
