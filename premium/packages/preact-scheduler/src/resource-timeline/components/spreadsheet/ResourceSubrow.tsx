import { joinClassNames } from '@fullcalendar/preact/public-api'
import { afterSize, isArraysEqual, memoWithEquality, RefMap, setRef, useLatest, useViewContext } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { useLayoutEffect, useRef, useState, type Ref } from 'react'
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
  inTreeGrid?: boolean

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
export const ResourceSubrow = memoWithEquality(function ResourceSubrow(props: ResourceSubrowProps) {
  const { options } = useViewContext()
  const { resource, resourceFields, colSpecs } = props

  // reports the tallest cell's inner height
  const isActiveRef = useRef(false)
  const propsRef = useLatest(props)
  const [innerHeightRefMap] = useState(() => {
    let currentInnerHeight: number | null = null

    const handleInnerHeights = () => {
      if (isActiveRef.current) {
        let max: number | null = null

        for (const innerHeight of innerHeightRefMap.current.values()) {
          if (max == null || innerHeight > max) {
            max = innerHeight
          }
        }

        if (currentInnerHeight !== max) {
          currentInnerHeight = max
          setRef(propsRef.current.innerHeightRef, max)
        }
      }
    }
    const innerHeightRefMap = new RefMap<number, number>(() => {
      afterSize(handleInnerHeights)
    })
    return innerHeightRefMap
  })

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

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
            inTreeGrid={props.inTreeGrid}
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
}, {
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
