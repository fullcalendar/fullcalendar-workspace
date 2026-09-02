import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import type { Ref } from 'react'
import { ColSpec } from '../../structs'
import { type AriaCellInput } from '../../aria'
import { ResourceGroupCell } from './ResourceGroupCell'

export interface ResourceGroupSubrowProps extends AriaCellInput {
  colSpec: ColSpec
  fieldValue: any
  rowSpan?: number
  width?: number
  grow?: number
  className?: string
  borderStart: boolean
  borderBottom: boolean

  // aria
  role?: string

  // refs
  innerHeightRef?: Ref<number>

  // position
  top?: number
  height?: number
}

/*
Screen-only row wrapper for a vertically spanning resource-group cell.
*/
export class ResourceGroupSubrow extends BaseComponent<ResourceGroupSubrowProps> {
  render() {
    let { props, context } = this
    let { options } = context

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <div // the "row"
        role={props.role as any} // !!!
        className={joinClassNames(
          options.resourceRowClass,
          props.className,
          classNames.flexRow,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={{
          top: props.top,
          height: props.height,
          minWidth: 0,
          width: props.width,
          flexGrow: props.grow,
        }}
      >
        <ResourceGroupCell
          cellIdPrefix={props.cellIdPrefix}
          cellRowIndex={props.cellRowIndex}
          cellColIndex={props.cellColIndex}
          colSpec={props.colSpec}
          fieldValue={props.fieldValue}
          rowSpan={props.rowSpan}
          borderStart={props.borderStart}
          innerHeightRef={props.innerHeightRef}
        />
      </div>
    )
  }
}
