import { BaseComponent, RefMap } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { ROW_BORDER_WIDTH } from '@full-ui/headless-grid'
import { ResourceGroupSubrow } from "./ResourceGroupSubrow"
import { ResourceGroupHeaderSubrow } from "./ResourceGroupHeaderSubrow"
import { ResourceSubrow } from "./ResourceSubrow"
import { GroupCellLayout, GroupRowLayout, ResourceLayout } from "../../resource-layout"
import { ColSpec } from '../../structs'
import { ItemPosition } from '../../virtual/virtualizer'
import { joinClassNames } from '@fullcalendar/preact/public-api'

export interface BodySectionProps {
  rowPositions: ItemPosition<ResourceLayout>[]
  groupRowPositions: ItemPosition<GroupRowLayout>[]
  groupColPositions: ItemPosition<GroupCellLayout>[][]
  resourceCnt: number
  groupRowCnt: number
  groupCellCnts: number[]
  colWidths: number[] | undefined
  colSpecs: ColSpec[]
  rowInnerHeightRefMap: RefMap<string, number>
  headerRowSpan: number
  hasNesting: boolean
  indentWidth: number | undefined
  canvasWidth: number | undefined
  canvasHeight: number | undefined
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

    return (
      <div
        className={classNames.flexRow}
        style={{
          minWidth: props.canvasWidth,
          minHeight: props.canvasHeight,
        }}
      >
        {/* group columns */}
        {props.groupColPositions.map((groupCellPositions, colIndex) => (
          <div
            key={colIndex}
            role='rowgroup'
            className={classNames.rel /* origin for abs-positioned rows */}
            style={{
              height: 0,
              minWidth: 0,
              width: colWidths[colIndex],
            }}
          >
            {groupCellPositions.map((groupCellPosition, groupIndex) => {
              const groupCellLayout = groupCellPosition.item
              const group = groupCellLayout.entity
              const groupKey = groupCellPosition.key
              const isNotLast = groupIndex < groupCellPositions.length - 1
              const rowHeight = groupCellPosition.size

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
                  top={groupCellPosition.start}
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
          className={classNames.rel}
          style={{
            height: 0,
            minWidth: 0,
            width: sumArray(colWidths.slice(groupColCnt)),
          }}
        >
          {/* group rows */}
          {props.groupRowPositions.map((groupRowPosition) => {
            const groupRowLayout = groupRowPosition.item
            const group = groupRowLayout.entity
            const groupKey = groupRowPosition.key
            const isNotLast = groupRowLayout.visibleIndex < visibleRowCnt - 1

            return (
              <div
                key={groupKey}
                role='row'
                aria-rowindex={1 + headerRowSpan + groupRowLayout.rowIndex}
                aria-level={hasNesting ? 1 + groupRowLayout.rowDepth : undefined}
                aria-expanded={groupRowLayout.isExpanded}
                className={joinClassNames(
                  classNames.fillX,
                  classNames.flexRow,
                )}
                style={{
                  top: groupRowPosition.start,
                }}
              >
                <ResourceGroupHeaderSubrow
                  group={group}
                  isExpanded={groupRowLayout.isExpanded}
                  innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                  colSpan={props.colSpecs.length}
                  borderBottom={isNotLast}
                  height={groupRowPosition.size}
                  indentWidth={props.indentWidth}
                  className={classNames.fillX}
                />
              </div>
            )
          })}

          {/* resource-specific cells */}
          {props.rowPositions.map((rowPosition) => {
            const resourceLayout = rowPosition.item
            const resource = resourceLayout.entity
            const isNotLast = resourceLayout.visibleIndex < visibleRowCnt - 1
            const rowHeight = rowPosition.size

            return (
              <ResourceSubrow
                key={resource.id /* TODO: use rowPosition.key? */}
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
                top={rowPosition.start}
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
