import { joinClassNames } from "@fullcalendar/core"
import { BaseComponent, RefMap } from "@fullcalendar/core/internal"
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'
import { Group, Resource } from "@fullcalendar/resource/internal"
import { ROW_BORDER_WIDTH } from '@full-ui/headless-grid'
import { ResourceGroupSubrow } from "./ResourceGroupSubrow.js"
import { ResourceGroupHeaderSubrow } from "./ResourceGroupHeaderSubrow.js"
import { ResourceSubrow } from "./ResourceSubrow.js"
import { GroupCellLayout, GroupRowLayout, ResourceLayout } from "../../resource-layout.js"
import { ColSpec } from '../../structs.js'
import { VirtualizerItemPosition } from "../../virtual/virtualizer.js"

export interface BodySectionProps {
  virtRowPositions: VirtualizerItemPosition<Resource>[]
  virtGroupPositions: VirtualizerItemPosition<Group>[]
  virtColPositions: VirtualizerItemPosition<Group>[][]

  resourceCnt: number
  groupRowCnt: number
  groupCellCnts: number[]

  colWidths: number[] | undefined
  colSpecs: ColSpec[]
  rowInnerHeightRefMap: RefMap<string, number>
  headerRowSpan: number
  hasNesting: boolean
  indentWidth: number | undefined
}

/*
Takes up no vertical space. Fills itself within outer container.
Caller is responsible for this.
*/
export class BodySection extends BaseComponent<BodySectionProps> {
  render() {
    const { props } = this
    const { rowInnerHeightRefMap, headerRowSpan, hasNesting } = props

    const visibleRowCnt = props.groupRowCnt + props.resourceCnt
    const groupColCnt = props.groupCellCnts.length

    const colWidths = props.colWidths || []
    const resourceX = sumArray(colWidths.slice(0, groupColCnt))

    /*
    TODO: simplify DOM structure to be more like time-area?
    where an actual DIV creates the mass, not a paddingTop

    TODO: this outer div can be discarded and parent should be canvas directly
    */
    return (
      <div className={joinClassNames(classNames.flexRow, classNames.fill)}>

        {/* group columns */}
        {props.virtColPositions.map((virtCellPositions, colIndex) => (
          <div
            key={colIndex}
            role='rowgroup'
            className={classNames.rel /* origin for abs-positioned rows */}
            style={{
              minWidth: 0,
              width: colWidths[colIndex],
            }}
          >
            {virtCellPositions.map((virtCellPosition, groupIndex) => {
              const groupCellLayout = virtCellPosition.item as GroupCellLayout
              const group = groupCellLayout.entity
              const groupKey = virtCellPosition.key
              const isNotLast = groupIndex < virtCellPositions.length - 1
              const rowHeight = virtCellPosition.size

              return (
                <ResourceGroupSubrow
                  key={groupKey}
                  colSpec={group.spec}
                  rowSpan={groupCellLayout.rowSpan}
                  fieldValue={group.value}
                  className={classNames.fillX}
                  borderStart={Boolean(colIndex)}
                  borderBottom={isNotLast}
                  role='row'
                  rowIndex={1 + headerRowSpan + groupCellLayout.rowIndex}
                  level={hasNesting ? 1 : undefined} // the resource-specific row at this rowindex is always depth 0
                  innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                  top={virtCellPosition.start}
                  height={
                    (rowHeight != null && isNotLast)
                      ? rowHeight + ROW_BORDER_WIDTH // considering bottom border, which is added to cell
                      : rowHeight
                  }
                />
              )
            })}
          </div>
        ))}

        <div
          role='rowgroup'
          className={classNames.fillY}
          style={{
            insetInlineStart: resourceX,
            insetInlineEnd: 0,
          }}
        >
          {/* group rows */}
          {props.virtGroupPositions.map((virtGroupPosition) => {
            const groupRowLayout = virtGroupPosition.item as GroupRowLayout
            const group = groupRowLayout.entity
            const groupKey = virtGroupPosition.key
            const isNotLast = groupRowLayout.visibleIndex < visibleRowCnt - 1

            return (
              <ResourceGroupHeaderSubrow
                key={groupKey}
                group={group}
                isExpanded={groupRowLayout.isExpanded}
                innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                role='row'
                rowIndex={1 + headerRowSpan + groupRowLayout.rowIndex}
                level={hasNesting ? 1 + groupRowLayout.rowDepth : undefined}
                colSpan={props.colSpecs.length}
                borderBottom={isNotLast}
                top={virtGroupPosition.start}
                height={virtGroupPosition.size}
                indentWidth={props.indentWidth}
                className={classNames.fillX}
              />
            )
          })}

          {/* resource-specific cells */}
          {props.virtRowPositions.map((virtRowPosition) => {
            const resourceLayout = virtRowPosition.item as ResourceLayout
            const resource = resourceLayout.entity
            const isNotLast = resourceLayout.visibleIndex < visibleRowCnt - 1
            const rowHeight = virtRowPosition.size

            return (
              <ResourceSubrow
                key={resource.id /* TODO: use virtRowPosition.key? */}
                resource={resource}
                resourceFields={resourceLayout.resourceFields}
                indent={resourceLayout.indent}
                hasChildren={resourceLayout.hasChildren}
                isExpanded={resourceLayout.isExpanded}
                colStartIndex={groupColCnt}
                colSpecs={props.colSpecs}
                colWidths={colWidths}
                innerHeightRef={rowInnerHeightRefMap.createRef(resource.id)}
                className={classNames.fillX}
                borderStart={Boolean(groupColCnt)}
                borderBottom={isNotLast}
                role='row'
                rowIndex={1 + headerRowSpan + resourceLayout.rowIndex}
                level={hasNesting ? 1 + resourceLayout.rowDepth : undefined}
                expanded={resourceLayout.hasChildren ? resourceLayout.isExpanded : undefined}
                top={virtRowPosition.start}
                height={
                  (rowHeight != null && isNotLast)
                    ? rowHeight + ROW_BORDER_WIDTH // considering bottom border, which is added to cell
                    : rowHeight
                }
                indentWidth={props.indentWidth}
              />
            )
          })}
        </div>
      </div>
    )
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function sumArray(a: number[]): number { // TODO: move to general
  let sum = 0

  for (const num of a) {
    sum += num
  }

  return sum
}
