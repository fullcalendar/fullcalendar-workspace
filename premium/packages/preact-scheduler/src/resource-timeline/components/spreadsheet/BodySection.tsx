import { BaseComponent, RefMap } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { ROW_BORDER_WIDTH } from '@full-ui/headless-grid'
import { ResourceGroupSubrow } from "./ResourceGroupSubrow"
import { ResourceGroupHeaderSubrow } from "./ResourceGroupHeaderSubrow"
import { ResourceSubrow } from "./ResourceSubrow"
import { GroupCellLayout, GroupRowLayout, ResourceRowLayout } from "../../resource-layout"
import { ColSpec } from '../../structs'
import { ItemPosition } from '../../virtual/virtualizer'
import { joinClassNames } from '@fullcalendar/preact/public-api'

export interface BodySectionProps {
  cellIdPrefix: string
  groupRowPositions: ItemPosition<GroupRowLayout>[]
  resourceRowPositions: ItemPosition<ResourceRowLayout>[]
  groupColPositions: ItemPosition<GroupCellLayout>[][]
  displayedRowCnt: number
  groupCellCnts: number[]
  colWidths: number[] | undefined
  colSpecs: ColSpec[]
  rowInnerHeightRefMap: RefMap<string, number>
  headerRowSpan: number
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
    const { rowInnerHeightRefMap, headerRowSpan } = props

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
        {props.groupColPositions.map((groupCellPositions, colIndex) => (
          <div
            key={colIndex}
            role='presentation'
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
                  role='presentation'
                  cellIdPrefix={props.cellIdPrefix}
                  cellRowIndex={1 + headerRowSpan + groupCellLayout.rowIndex}
                  cellColIndex={colIndex}
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
          role='presentation'
          className={classNames.rel}
          style={{
            height: 0,
            minWidth: 0,
            width: sumArray(colWidths.slice(groupColCnt)),
          }}
        >
          {props.groupRowPositions.map((rowPosition) => {
            const groupRowLayout = rowPosition.item
            const group = groupRowLayout.entity
            const groupKey = rowPosition.key
            // Compare against every expansion-filtered row, not only the virtualized subset.
            const isNotLast = groupRowLayout.visibleIndex < props.displayedRowCnt - 1

            return (
              <div
                key={groupKey}
                role='presentation'
                className={joinClassNames(
                  classNames.fillX,
                  classNames.flexRow,
                )}
                style={{
                  top: rowPosition.start,
                }}
              >
                <ResourceGroupHeaderSubrow
                  cellIdPrefix={props.cellIdPrefix}
                  cellRowIndex={1 + headerRowSpan + groupRowLayout.rowIndex}
                  cellColIndex={0}
                  group={group}
                  isExpanded={groupRowLayout.isExpanded}
                  innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                  colSpan={props.colSpecs.length}
                  borderBottom={isNotLast}
                  height={rowPosition.size}
                  indentWidth={props.indentWidth}
                  className={classNames.fillX}
                />
              </div>
            )
          })}

          {props.resourceRowPositions.map((rowPosition) => {
            const resourceLayout = rowPosition.item
            const resource = resourceLayout.entity
            const rowHeight = rowPosition.size
            // Compare against every expansion-filtered row, not only the virtualized subset.
            const isNotLast = resourceLayout.visibleIndex < props.displayedRowCnt - 1

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
                role='presentation'
                cellIdPrefix={props.cellIdPrefix}
                cellRowIndex={1 + headerRowSpan + resourceLayout.rowIndex}
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
