import { joinClassNames } from '@fullcalendar/core/internal'
import { ComponentChild, createElement, Ref } from '@fullcalendar/core/preact'
import { HeaderRow } from './header/HeaderRow.js'

export interface DayGridHeaderProps<Model, ModelKey> {
  headerTiers: Model[][]
  renderHeaderContent: (
    model: Model,
    tier: number,
    cellI: number,
    innerHeightRef: Ref<number> | undefined, // unused
    width: number | undefined
  ) => ComponentChild
  getHeaderModelKey: (model: Model) => ModelKey

  // render hooks
  className?: string

  // dimensions
  colWidth?: number
  width?: number
  paddingLeft?: number
  paddingRight?: number
}

export function DayGridHeader<Model, ModelKey>(props: DayGridHeaderProps<Model, ModelKey>) {
  return (
    <div
      className={joinClassNames(
        props.className,
        // fc-flex-column unnecessary if className contain fc-table-header
        'fc-flex-column fc-content-box',
      )}
      style={{
        width: props.width,
        paddingLeft: props.paddingLeft,
        paddingRight: props.paddingRight,
      }}
    >
      {props.headerTiers.map((cells, tierNum) => (
        <HeaderRow
          key={tierNum}
          tierNum={tierNum}
          cells={cells}
          renderHeaderContent={props.renderHeaderContent}
          getHeaderModelKey={props.getHeaderModelKey}
          colWidth={props.colWidth}
          className={tierNum ? 'fc-border-t' : ''}
        />
      ))}
    </div>
  )
}
