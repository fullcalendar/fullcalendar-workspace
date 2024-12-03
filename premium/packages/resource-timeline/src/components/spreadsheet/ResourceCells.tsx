import { afterSize, BaseComponent, isArraysEqual, RefMap, setRef, ViewContext } from '@fullcalendar/core/internal'
import { Fragment, Ref, createElement } from '@fullcalendar/core/preact'
import { Resource, ColSpec, getPublicId } from '@fullcalendar/resource/internal'
import { ResourceCell } from './ResourceCell.js'

export interface ResourceCellsProps {
  resource: Resource
  resourceFields: any
  colStartIndex: number
  colSpecs: ColSpec[] // starts at colStartIndex
  indent: number
  isExpanded: boolean
  hasChildren: boolean
  className?: string

  // refs
  innerHeightRef?: Ref<number>

  // sizing
  colWidths: number[] // starts at colStartIndex
}

export class ResourceCells extends BaseComponent<ResourceCellsProps, ViewContext> {
  // refs
  private innerHeightRefMap = new RefMap<number, number>(() => {
    afterSize(this.handleInnerHeights)
  })
  private currentInnerHeight: number | null = null

  render() {
    let { props, innerHeightRefMap } = this
    let { resource, resourceFields, colSpecs, colWidths } = props

    return (
      <Fragment>
        {mapRange(props.colStartIndex, colSpecs.length, (i) => {
          const colSpec = colSpecs[i]
          const fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          return (
            <ResourceCell
              key={i} // eslint-disable-line react/no-array-index-key
              colIndex={i}
              colSpec={colSpec}
              resource={resource}
              fieldValue={fieldValue}
              indent={props.indent}
              hasChildren={props.hasChildren}
              isExpanded={props.isExpanded}
              innerHeightRef={innerHeightRefMap.createRef(i)}
              width={colWidths[i]}
              className={props.className}
            />
          )
        })}
      </Fragment>
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

ResourceCells.addPropsEquality({
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
