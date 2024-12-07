import { BaseComponent, joinClassNames, RefMap } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { ColSpec, createGroupId } from "@fullcalendar/resource/internal"
import { GroupTallCell } from "./GroupTallCell.js"
import { GroupWideCell } from "./GroupWideCell.js"
import { ResourceCells } from "./ResourceCells.js"
import { sliceSpreadsheetColWidth } from "../../col-positioning.js"
import { GroupCellLayout, GroupRowLayout, ResourceLayout } from "../../resource-layout.js"

export interface BodySectionProps {
  flatResourceLayouts: ResourceLayout[]
  flatGroupRowLayouts: GroupRowLayout[]
  flatGroupColLayouts: GroupCellLayout[][]
  colWidths: number[]
  colSpecs: ColSpec[]
  rowInnerHeightRefMap: RefMap<string, number>
  rowTops: Map<string, number>
  rowHeights: Map<string, number>
}

/*
Takes up no vertical space. Fills itself within outer container.
Caller is responsible for this.
*/
export class BodySection extends BaseComponent<BodySectionProps> {
  render() {
    const { props, context } = this
    const { colWidths, rowInnerHeightRefMap, rowTops, rowHeights } = props

    // TODO: less-weird way to get this! more DRY with ResourceTimelineLayoutNormal
    const groupRowCnt = props.flatGroupRowLayouts.length
    const resourceCnt = props.flatResourceLayouts.length
    const rowCnt = groupRowCnt + resourceCnt

    const groupColCnt = props.flatGroupColLayouts.length
    const resourceX = sliceSpreadsheetColWidth(colWidths, 0, groupColCnt)
    const resourceColWidths = colWidths.slice(groupColCnt)

    /*
    TODO: simplify DOM structure to be more like time-area?
    where an actual DIV creates the mass, not a paddingTop
    */
    return (
      <div className='fc-flex-row fc-fill'>

        {/* group columns */}
        {props.flatGroupColLayouts.map((groupColLayouts, colIndex) => (
          <div
            key={colIndex}
            className={joinClassNames(
              'fc-rel',
              colIndex && 'fc-border-s',
            )}
            style={{
              width: colWidths[colIndex],
            }}
          >
            {groupColLayouts.map((groupCellLayout) => {
              const group = groupCellLayout.entity
              const groupKey = createGroupId(group)
              const isNotLast = groupCellLayout.rowIndex < groupColLayouts.length - 1

              return (
                <div
                  key={groupKey}
                  role='row'
                  aria-rowindex={groupCellLayout.rowIndex}
                  class='fc-flex-row fc-fill-x'
                  style={{
                    top: rowTops.get(groupKey),
                    height: rowHeights.get(groupKey),
                  }}
                >
                  <GroupTallCell
                    colSpec={group.spec}
                    fieldValue={group.value}
                    innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                    className={isNotLast ? 'fc-border-b' : ''}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {/* for resource column lines */}
        {resourceColWidths.map((resourceColWidth, i) => (
          <div
            className={joinClassNames(
              (groupColCnt + i) && 'fc-border-s',
            )}
            style={{
              width: resourceColWidth,
            }}
          />
        ))}

        {/* resource-specific cells */}
        <div
          className='fc-flex-row fc-rel fc-fill'
          style={
            context.isRtl // TODO: util for this?
              ? { right: resourceX }
              : { left: resourceX }
          }
        >
          {props.flatResourceLayouts.map((resourceLayout) => {
            const resource = resourceLayout.entity
            const isNotLast = resourceLayout.rowIndex < rowCnt - 1

            return (
              <div
                key={resource.id}
                role='row'
                aria-rowindex={resourceLayout.rowIndex}
                data-resource-id={resource.id}
                class='fc-flex-row fc-fill-x'
                style={{
                  top: rowTops.get(resource.id),
                  height: rowHeights.get(resource.id),
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
                    'fc-resource',
                    isNotLast && 'fc-border-b',
                  )}
                />
              </div>
            )
          })}
        </div>

        {/* resource-group rows */}
        {props.flatGroupRowLayouts.map((groupRowLayout) => {
          const group = groupRowLayout.entity
          const groupKey = createGroupId(group)
          const isNotLast = groupRowLayout.rowIndex < rowCnt - 1

          return (
            <div
              key={groupKey}
              role='row'
              aria-rowindex={groupRowLayout.rowIndex}
              class='fc-flex-row fc-fill-x'
              style={{
                top: rowTops.get(groupKey),
                height: rowHeights.get(groupKey),
              }}
            >
              <GroupWideCell
                group={group}
                isExpanded={groupRowLayout.isExpanded}
                innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                className={isNotLast ? 'fc-border-b' : ''}
              />
            </div>
          )
        })}
      </div>
    )
  }
}
