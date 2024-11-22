import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayGridHeaderRow } from './DayGridHeaderRow.js'
import { RowConfig } from '../header-tier.js'

export interface DayGridHeaderProps {
  headerTiers: RowConfig<{ text: string, isDisabled: boolean }>[]
  className?: string

  // dimensions
  colWidth?: number
  width?: number
  paddingLeft?: number
  paddingRight?: number
}

export class DayGridHeader extends BaseComponent<DayGridHeaderProps> {
  render() {
    const { props } = this
    return (
      <div
        className={joinClassNames(
          props.className,
          'fc-flex-col fc-content-box',
        )}
        style={{
          width: props.width,
          paddingLeft: props.paddingLeft,
          paddingRight: props.paddingRight,
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
