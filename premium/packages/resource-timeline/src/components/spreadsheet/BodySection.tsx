import { BaseComponent, RefMap } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { ColSpec, createGroupId } from "@fullcalendar/resource/internal"
import { ResourceGroupSubrow } from "./ResourceGroupSubrow.js"
import { ResourceGroupHeaderSubrow } from "./ResourceGroupHeaderSubrow.js"
import { ResourceSubrow } from "./ResourceSubrow.js"
import { GroupCellLayout, GroupRowLayout, ResourceLayout } from "../../resource-layout.js"
import { ROW_BORDER_WIDTH } from "../../resource-positioning.js"

export interface BodySectionProps {
  flatResourceLayouts: ResourceLayout[]
  flatGroupRowLayouts: GroupRowLayout[]
  flatGroupColLayouts: GroupCellLayout[][]
  colWidths: number[] | undefined
  colSpecs: ColSpec[]
  rowInnerHeightRefMap: RefMap<string, number>
  rowTops: Map<string, number>
  rowHeights: Map<string, number>
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
    const { props, context } = this
    const { rowInnerHeightRefMap, rowTops, rowHeights, headerRowSpan, hasNesting } = props

    // TODO: less-weird way to get this! more DRY with ResourceTimelineLayoutNormal
    const groupRowCnt = props.flatGroupRowLayouts.length
    const resourceCnt = props.flatResourceLayouts.length
    const visibleRowCnt = groupRowCnt + resourceCnt

    const groupColCnt = props.flatGroupColLayouts.length

    const colWidths = props.colWidths || []
    const resourceX = sumArray(colWidths.slice(0, groupColCnt))

    /*
    TODO: simplify DOM structure to be more like time-area?
    where an actual DIV creates the mass, not a paddingTop

    TODO: this outer div can be discarded and parent should be canvas directly
    */
    return (
      <div className='fcu-flex-row fcu-fill'>

        {/* group columns */}
        {props.flatGroupColLayouts.map((groupColLayouts, colIndex) => (
          <div
            key={colIndex}
            role='rowgroup'
            className='fcu-rel'
            style={{
              minWidth: 0,
              width: colWidths[colIndex],
            }}
          >
            {groupColLayouts.map((groupCellLayout, groupIndex) => {
              const group = groupCellLayout.entity
              const groupKey = createGroupId(group)
              const isNotLast = groupIndex < groupColLayouts.length - 1
              const rowHeight = rowHeights.get(groupKey)

              return (
                <ResourceGroupSubrow
                  key={groupKey}
                  colSpec={group.spec}
                  rowSpan={groupCellLayout.rowSpan}
                  fieldValue={group.value}
                  className='fcu-fill-x'
                  borderStart={Boolean(colIndex)}
                  borderBottom={isNotLast}
                  role='row'
                  rowIndex={1 + headerRowSpan + groupCellLayout.rowIndex}
                  level={hasNesting ? 1 : undefined} // the resource-specific row at this rowindex is always depth 0
                  innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                  top={rowTops.get(groupKey)}
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
          className='fcu-fill fcu-rel'
          style={
            context.isRtl // TODO: util for this?
              ? { right: resourceX }
              : { left: resourceX }
          }
        >
          {/* group rows */}
          {props.flatGroupRowLayouts.map((groupRowLayout) => {
            const group = groupRowLayout.entity
            const groupKey = createGroupId(group)
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
                top={rowTops.get(groupKey)}
                height={rowHeights.get(groupKey)}
                indentWidth={props.indentWidth}
                className='fcu-fill-x'
              />
            )
          })}

          {/* resource-specific cells */}
          {props.flatResourceLayouts.map((resourceLayout) => {
            const resource = resourceLayout.entity
            const isNotLast = resourceLayout.visibleIndex < visibleRowCnt - 1
            const rowHeight = rowHeights.get(resource.id)

            return (
              <ResourceSubrow
                key={resource.id}
                resource={resource}
                resourceFields={resourceLayout.resourceFields}
                indent={resourceLayout.indent}
                hasChildren={resourceLayout.hasChildren}
                isExpanded={resourceLayout.isExpanded}
                colStartIndex={props.flatGroupColLayouts.length}
                colSpecs={props.colSpecs}
                colWidths={colWidths}
                innerHeightRef={rowInnerHeightRefMap.createRef(resource.id)}
                className='fcu-fill-x'
                borderStart={Boolean(groupColCnt)}
                borderBottom={isNotLast}
                role='row'
                rowIndex={1 + headerRowSpan + resourceLayout.rowIndex}
                level={hasNesting ? 1 + resourceLayout.rowDepth : undefined}
                expanded={resourceLayout.hasChildren ? resourceLayout.isExpanded : undefined}
                top={rowTops.get(resource.id)}
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
