import { afterSize, BaseComponent, isArraysEqual, joinArrayishClassNames, RefMap, setRef, ViewContext } from '@fullcalendar/core/internal'
import { Ref, createElement } from '@fullcalendar/core/preact'
import { Resource, ColSpec, getPublicId } from '@fullcalendar/resource/internal'
import { ResourceCell } from './ResourceCell.js'

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

  // positioning
  top?: number
  height?: number
}

export class ResourceSubrow extends BaseComponent<ResourceSubrowProps, ViewContext> {
  // refs
  private innerHeightRefMap = new RefMap<number, number>(() => {
    afterSize(this.handleInnerHeights)
  })
  private currentInnerHeight: number | null = null

  render() {
    const { props, innerHeightRefMap } = this
    const { resource, resourceFields, colSpecs } = props
    const { options } = this.context

    const colWidths = props.colWidths || []
    const colGrows = props.colGrows || []

    return (
      <div
        role={props.role as any} // !!!
        aria-rowindex={props.rowIndex}
        aria-level={props.level}
        aria-expanded={props.expanded}
        data-resource-id={resource.id}
        className={joinArrayishClassNames(
          props.className, // what for???
          options.resourceAreaRowClassNames,
          'fc-resource',
          'fc-flex-row',
          props.borderBottom ? 'fc-border-only-b' : 'fc-border-none',
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
              colSpec={colSpec}
              resource={resource}
              fieldValue={fieldValue}
              indent={props.indent}
              hasChildren={props.hasChildren}
              isExpanded={props.isExpanded}
              innerHeightRef={innerHeightRefMap.createRef(i)}
              width={colWidths[i]}
              grow={colGrows[i]}
              className={i ? 'fc-border-only-s' : 'fc-border-none'}
            />
          )
        })}
      </div>
    )
  }

  private handleInnerHeights = () => {
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
// TODO: make public

function mapRange<Item>(start: number, end: number, func: (index: number) => Item): Item[] {
  const items: Item[] = []

  for (let i = start; i < end; i++) {
    items.push(func(i))
  }

  return items
}
