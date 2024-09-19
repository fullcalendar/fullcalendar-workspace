import { afterSize, BaseComponent, isArraysEqual, RefMap, setRef, ViewContext } from '@fullcalendar/core/internal'
import { Fragment, Ref, createElement } from '@fullcalendar/core/preact'
import { Resource, ColSpec, getPublicId } from '@fullcalendar/resource/internal'
import { ResourceCell } from './ResourceCell.js'

export interface ResourceCellsProps {
  resource: Resource
  resourceFields: any
  colSpecs: ColSpec[]
  indent: number
  isExpanded: boolean
  hasChildren: boolean

  // refs
  innerHeightRef?: Ref<number>

  // sizing
  colWidths: number[]
}

export class ResourceCells extends BaseComponent<ResourceCellsProps, ViewContext> {
  // refs
  private innerHeightRefMap = new RefMap<number, number>(() => {
    afterSize(this.handleInnerHeights)
  })
  private currentInnerHeight?: number

  render() {
    let { props, innerHeightRefMap } = this
    let { resource, resourceFields, colWidths } = props

    return (
      <Fragment>
        {props.colSpecs.map((colSpec, i) => {
          let fieldValue = colSpec.field ? resourceFields[colSpec.field] :
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
            />
          )
        })}
      </Fragment>
    )
  }

  private handleInnerHeights = () => {
    const innerHeightMap = this.innerHeightRefMap.current
    let max = 0

    for (const innerHeight of innerHeightMap.values()) {
      max = Math.max(max, innerHeight)
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
