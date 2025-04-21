import { BaseComponent, joinArrayishClassNames, joinClassNames, RefMap } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { ColSpec, createGroupId } from "@fullcalendar/resource/internal"
import { GroupTallCell } from "./GroupTallCell.js"
import { GroupWideCell } from "./GroupWideCell.js"
import { ResourceCells } from "./ResourceCells.js"
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
}

/*
Takes up no vertical space. Fills itself within outer container.
Caller is responsible for this.
*/
export class BodySection extends BaseComponent<BodySectionProps> {
  render() {
    const { props, context } = this
    const { options } = context
    const { rowInnerHeightRefMap, rowTops, rowHeights, headerRowSpan, hasNesting } = props

    // TODO: less-weird way to get this! more DRY with ResourceTimelineLayoutNormal
    const groupRowCnt = props.flatGroupRowLayouts.length
    const resourceCnt = props.flatResourceLayouts.length
    const visibleRowCnt = groupRowCnt + resourceCnt

    const groupColCnt = props.flatGroupColLayouts.length

    const colWidths = props.colWidths || []
    const resourceX = sumArray(colWidths.slice(0, groupColCnt))
    const resourceColWidths = colWidths.slice(groupColCnt)

    /*
    TODO: simplify DOM structure to be more like time-area?
    where an actual DIV creates the mass, not a paddingTop

    TODO: this outer div can be discarded and parent should be canvas directly
    */
    return (
      <div className='fc-flex-row fc-fill'>

        {/* group columns */}
        {props.flatGroupColLayouts.map((groupColLayouts, colIndex) => (
          <div
            key={colIndex}
            role='rowgroup'
            className={joinClassNames(
              'fc-rel',
              'fc-cell-bordere', // TODO: temporary
              colIndex ? 'fc-border-only-s' : 'fc-border-none',
            )}
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
                <div
                  key={groupKey}
                  role='row'
                  aria-rowindex={1 + headerRowSpan + groupCellLayout.rowIndex}
                  aria-level={hasNesting ? 1 : undefined} // the resource-specific row at this rowindex is always depth 0
                  class={joinArrayishClassNames(
                    'fc-flex-row fc-fill-x',
                    // TODO: options.resourceAreaRowClassNames
                  )}
                  style={{
                    top: rowTops.get(groupKey),
                    height: (rowHeight != null && isNotLast)
                      ? rowHeight + ROW_BORDER_WIDTH // considering bottom border, which is added to cell
                      : rowHeight,
                  }}
                >
                  <GroupTallCell
                    colSpec={group.spec}
                    rowSpan={groupCellLayout.rowSpan}
                    fieldValue={group.value}
                    className={joinClassNames(
                      'fc-liquid',
                      'fc-row-bordered', // TODO: temporary
                      isNotLast ? 'fc-border-only-b' : 'fc-border-none',
                    )}
                    innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {/* for resource column lines */}
        {resourceColWidths.map((colWidth, i) => (
          <div
            aria-hidden
            className={joinClassNames(
              'fc-cell-bordered',
              (groupColCnt + i) ? 'fc-border-only-s' : 'fc-border-none',
            )}
            style={{
              minWidth: 0,
              width: colWidth,
            }}
          />
        ))}

        <div
          role='rowgroup'
          className='fc-fill fc-rel'
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
              <div
                key={groupKey}
                role='row'
                aria-rowindex={1 + headerRowSpan + groupRowLayout.rowIndex}
                aria-level={hasNesting ? 1 + groupRowLayout.rowDepth : undefined}
                aria-expanded={groupRowLayout.isExpanded}
                class={joinArrayishClassNames(
                  'fc-flex-row fc-fill-x fc-content-box',
                  'fc-row-bordered', // TODO: temporary
                  isNotLast ? 'fc-border-only-b' : 'fc-border-none',
                  options.resourceAreaRowClassNames,
                )}
                style={{
                  top: rowTops.get(groupKey),
                  height: rowHeights.get(groupKey),
                }}
              >
                <GroupWideCell
                  group={group}
                  isExpanded={groupRowLayout.isExpanded}
                  innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                  colSpan={props.colSpecs.length}
                />
              </div>
            )
          })}

          {/* resource-specific cells */}
          {props.flatResourceLayouts.map((resourceLayout) => {
            const resource = resourceLayout.entity
            const isNotLast = resourceLayout.visibleIndex < visibleRowCnt - 1
            const rowHeight = rowHeights.get(resource.id)

            return (
              <div
                key={resource.id}
                role='row'
                aria-rowindex={1 + headerRowSpan + resourceLayout.rowIndex}
                aria-level={hasNesting ? 1 + resourceLayout.rowDepth : undefined}
                aria-expanded={resourceLayout.hasChildren ? resourceLayout.isExpanded : undefined}
                class={joinArrayishClassNames(
                  'fc-flex-row fc-fill-x'
                  // TODO: options.resourceAreaRowClassNames,
                )}
                style={{
                  top: rowTops.get(resource.id),
                  height: (rowHeight != null && isNotLast)
                    ? rowHeight + ROW_BORDER_WIDTH // considering bottom border, which is added to cell
                    : rowHeight
                }}
              >
                <ResourceCells
                  resource={resource}
                  resourceFields={resourceLayout.resourceFields}
                  indent={resourceLayout.indent}
                  hasChildren={resourceLayout.hasChildren}
                  isExpanded={resourceLayout.isExpanded}
                  colStartIndex={props.flatGroupColLayouts.length}
                  colSpecs={props.colSpecs}
                  colWidths={colWidths}
                  innerHeightRef={rowInnerHeightRefMap.createRef(resource.id)}
                  className={joinClassNames(
                    'fc-row-bordered', // TODO: temporary
                    isNotLast ? 'fc-border-only-b' : 'fc-border-none',
                  )}
                />
              </div>
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
