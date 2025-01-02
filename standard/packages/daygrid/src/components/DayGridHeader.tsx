import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayGridHeaderRow } from './DayGridHeaderRow.js'
import { RowConfig } from '../header-tier.js'

export interface DayGridHeaderProps {
  headerTiers: RowConfig<{ text: string, isDisabled: boolean }>[]
  className?: string

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
    return (
      <div
        role='rowgroup'
        className={joinClassNames(
          props.className,
          'fc-flex-col',
          props.width == null && 'fc-liquid',
        )}
        style={{
          width: props.width
        }}
      >
        {props.headerTiers.map((rowConfig, tierNum) => (
          <DayGridHeaderRow
            {...rowConfig}
            key={tierNum}
            className={tierNum ? 'fc-border-t' : ''}
            colWidth={props.colWidth}
          />
        ))}
      </div>
    )
  }
}
