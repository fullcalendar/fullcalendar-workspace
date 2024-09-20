import { BaseComponent } from '@fullcalendar/core/internal'
import { Fragment, ComponentChild, createElement, Ref } from '@fullcalendar/core/preact'

export interface HeaderRowProps<Model, ModelKey> {
  tierNum: number
  cells: Model[]
  renderHeaderContent: (
    model: Model,
    tier: number,
    innerHeightRef: Ref<number> | undefined, // unused
    width: number | undefined
  ) => ComponentChild
  getHeaderModelKey: (model: Model) => ModelKey
  cellGroup?: boolean // bad name now
  className?: string

  // dimensions
  colWidth?: number
}

export class HeaderRow<Model, ModelKey> extends BaseComponent<HeaderRowProps<Model, ModelKey>> {
  render() {
    const { props } = this

    return (
      <div
        role={props.cellGroup ? undefined : 'row'}
        className={[
          props.cellGroup ? 'fcnew-flex-row' : 'fcnew-row',
          props.className || '',
        ].join(' ')}
      >
        {props.cells.map((cell) => (
          <Fragment key={props.getHeaderModelKey(cell)}>
            {props.renderHeaderContent(
              cell,
              props.tierNum,
              undefined, // innerHeightRef
              props.colWidth,
            )}
          </Fragment>
        ))}
      </div>
    )
  }
}
