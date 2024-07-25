import { ComponentChild, createElement, Fragment } from '@fullcalendar/core/preact'

export interface DayGridHeaderProps<Model, ModelKey> {
  headerTiers: Model[][]
  renderHeaderContent: (model: Model, tier: number) => ComponentChild
  getHeaderModelKey: (model: Model) => ModelKey

  // render hooks
  extraClassNames?: string[]

  // dimensions
  width?: number
  paddingLeft?: number
  paddingRight?: number
}

export function DayGridHeader<Model, ModelKey>(props: DayGridHeaderProps<Model, ModelKey>) {
  return (
    <div
      className={[
        'fcnew-daygrid-header',
        ...(props.extraClassNames || []),
      ].join(' ')}
      style={{
        width: props.width,
        paddingLeft: props.paddingLeft,
        paddingRight: props.paddingRight,
      }}
    >
      {props.headerTiers.map((cells, tierNum) => (
        <div key={tierNum} role='row' class='fcnew-daygrid-header-row'>
          {cells.map((cell) => (
            <Fragment key={props.getHeaderModelKey(cell)}>
              {props.renderHeaderContent(cell, tierNum)}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}
