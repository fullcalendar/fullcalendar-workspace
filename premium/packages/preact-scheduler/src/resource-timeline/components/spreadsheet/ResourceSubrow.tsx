import { joinClassNames } from '@fullcalendar/preact/public-api'
import { afterSize, BaseComponent, isArraysEqual, RefMap, setRef, ViewContext } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import type { Ref } from 'react'
import { Resource, getPublicId } from '../../../resource/structs/resource'
import { ResourceCell } from './ResourceCell'
import { ColSpec } from '../../structs'

export interface ResourceSubrowProps {
  resource: Resource
  resourceFields: any
  colStartIndex: number
  colSpecs: ColSpec[] // starts at colStartIndex
  indent: number
  isExpanded: boolean
  hasChildren: boolean
  className?: string
  borderBottom: boolean | undefined
  borderStart: boolean

  // aria
  role?: string
  cellIdPrefix?: string
  cellRowIndex?: number

  // refs
  innerHeightRef?: Ref<number>

  // sizing
  colWidths: number[] | undefined
  indentWidth: number | undefined

  // positioning
  top?: number
  height?: number
}

/*
For screen-only
*/
export class ResourceSubrow extends BaseComponent<ResourceSubrowProps, ViewContext> {
  // refs
  private innerHeightRefMap = new RefMap<number, number>(() => {
    afterSize(this.handleInnerHeights)
  })
  private currentInnerHeight: number | null = null
  private _isUnmounting: boolean

  render() {
    const { props, innerHeightRefMap } = this
    const { resource, resourceFields, colSpecs } = props
    const { options } = this.context

    const colWidths = props.colWidths || []

    return (
      <div
        role={props.role as any} // !!!
        className={joinClassNames(
          options.resourceRowClass,
          props.className, // what for???
          classNames.flexRow,
          classNames.borderlessX,
          classNames.borderlessTop,
          !props.borderBottom && classNames.borderlessBottom,
        )}
        style={{
          top: props.top,
          height: props.height,
        }}
      >
        {mapRange(props.colStartIndex, colSpecs.length, (i) => {
          const colSpec = colSpecs[i]
          const fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          return (
            <ResourceCell
              key={i} // eslint-disable-line react/no-array-index-key
              cellIdPrefix={props.cellIdPrefix}
              cellRowIndex={props.cellRowIndex}
              cellColIndex={props.cellIdPrefix ? i : undefined}
              colSpec={colSpec}
              resource={resource}
              field={colSpec.field || 'title'}
              fieldValue={fieldValue}
              indent={props.indent}
              hasChildren={props.hasChildren}
              isExpanded={props.isExpanded}
              innerHeightRef={innerHeightRefMap.createRef(i)}
              width={colWidths[i]}
              indentWidth={props.indentWidth}
              borderStart={props.borderStart || Boolean(i)}
            />
          )
        })}
      </div>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.currentInnerHeight = null
  }

  private handleInnerHeights = () => {
    if (this._isUnmounting) return
    const innerHeightMap = this.innerHeightRefMap.current
    let max: number | null = null

    for (const innerHeight of innerHeightMap.values()) {
      if (max == null || innerHeight > max) {
        max = innerHeight
      }
    }

    if (this.currentInnerHeight !== max) {
      this.currentInnerHeight = max
      setRef(this.props.innerHeightRef, max)
    }
  }
}

ResourceSubrow.addPropsEquality({
  colWidths: isArraysEqual,
})

// Utils
// -------------------------------------------------------------------------------------------------

function mapRange<Item>(start: number, end: number, func: (index: number) => Item): Item[] {
  const items: Item[] = []

  for (let i = start; i < end; i++) {
    items.push(func(i))
  }

  return items
}
