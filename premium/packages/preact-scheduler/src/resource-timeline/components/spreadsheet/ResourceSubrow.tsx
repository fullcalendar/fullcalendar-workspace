import { afterSize, BaseComponent, isArraysEqual, joinClassNames, RefMap, setRef, ViewContext } from '@fullcalendar/preact/protected-api'
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
  rowIndex?: number
  level?: number
  expanded?: boolean

  // refs
  innerHeightRef?: Ref<number>

  // sizing
  colWidths: number[] | undefined
  colGrows?: number[]
  indentWidth: number | undefined

  // positioning
  top?: number
  height?: number
  totalX?: boolean
}

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
    const colGrows = props.colGrows || []

    let totalColWidth: number
    let totalColGrow: number

    if (props.totalX) {
      if (props.colWidths) {
        totalColWidth = totalColDims(props.colWidths, props.colStartIndex, colSpecs.length)
      }
      if (props.colGrows) {
        totalColGrow = totalColDims(props.colGrows, props.colStartIndex, colSpecs.length)
      }
    }

    return (
      <div
        role={props.role as any} // !!!
        aria-rowindex={props.rowIndex}
        aria-level={props.level}
        aria-expanded={props.expanded}
        className={joinClassNames(
          options.resourceRowClass,
          props.className, // what for???
          classNames.flexRow,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={{
          top: props.top,
          height: props.height,
          width: totalColWidth,
          flexGrow: totalColGrow,
        }}
      >
        {mapRange(props.colStartIndex, colSpecs.length, (i) => {
          const colSpec = colSpecs[i]
          const fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          return (
            <ResourceCell
              key={i} // eslint-disable-line react/no-array-index-key
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
              grow={colGrows[i]}
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

function totalColDims(colDims: number[], startIndex: number, endIndex: number): number {
  let total = 0

  for (let i = startIndex; i < endIndex; i++) {
    total += colDims[i]
  }

  return total
}
