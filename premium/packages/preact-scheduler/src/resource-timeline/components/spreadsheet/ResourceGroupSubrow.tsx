import { joinClassNames } from '@fullcalendar/preact/public-api'
import { useViewOptions } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, type Ref } from 'react'
import { ColSpec } from '../../col-options'
import { type AriaCellInput } from '../aria'
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
export const ResourceGroupSubrow = memo(function ResourceGroupSubrow(props: ResourceGroupSubrowProps) {
  const options = useViewOptions()

  // a grouped cell. no data that is specific to this specific resource
  // `colSpec` is for the group. a GroupSpec :(
  return (
    <div // the "row"
      role={props.role as any} // !!!
      className={joinClassNames(
        options.resourceRowClass,
        props.className,
        classNames.flexRow,
        classNames.borderlessX,
        classNames.borderlessTop,
        !props.borderBottom && classNames.borderlessBottom,
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
})
