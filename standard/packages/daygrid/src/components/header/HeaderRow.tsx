import { BaseComponent, joinClassNames } from '@fullcalendar/core/internal'
import { Fragment, ComponentChild, createElement, Ref } from '@fullcalendar/core/preact'

export interface HeaderRowProps<Model, ModelKey> {
  tierNum: number
  cells: Model[]
  renderHeaderContent: (
    model: Model,
    tier: number,
    cellI: number,
    innerHeightRef: Ref<number> | undefined, // unused
    width: number | undefined
  ) => ComponentChild
  getHeaderModelKey: (model: Model) => ModelKey
  className?: string

  // dimensions
  colWidth?: number
}

export class HeaderRow<Model, ModelKey> extends BaseComponent<HeaderRowProps<Model, ModelKey>> {
  render() {
    const { props } = this

    return (
      <div
        role='row' // TODO: audit this
        className={joinClassNames(
          props.className,
          'fc-flex-row',
        )}
      >
        {props.cells.map((cell, cellI) => (
          <Fragment key={props.getHeaderModelKey(cell)}>
            {props.renderHeaderContent(
              cell,
              props.tierNum,
              cellI,
              undefined, // innerHeightRef
              props.colWidth,
            )}
          </Fragment>
        ))}
      </div>
    )
  }
}
