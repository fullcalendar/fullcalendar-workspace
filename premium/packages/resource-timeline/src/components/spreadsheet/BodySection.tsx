import { BaseComponent, joinClassNames, RefMap } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { ColSpec, createGroupId } from "@fullcalendar/resource/internal"
import { GroupTallCell } from "./GroupTallCell.js"
import { GroupWideCell } from "./GroupWideCell.js"
import { ResourceCells } from "./ResourceCells.js"
import { GroupCellLayout, GroupRowLayout, ResourceLayout } from "../../resource-layout.js"
import { ROW_BORDER_WIDTH } from "../../resource-positioning.js"
import { sumPixels } from "../../col-positioning.js"

export interface BodySectionProps {
  flatResourceLayouts: ResourceLayout[]
  flatGroupRowLayouts: GroupRowLayout[]
  flatGroupColLayouts: GroupCellLayout[][]
  colWidthConfigs: { pixels: number, grow: number }[] // used ONLY FOR PIXELS
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
    const { colWidthConfigs, rowInnerHeightRefMap, rowTops, rowHeights } = props

    // TODO: less-weird way to get this! more DRY with ResourceTimelineLayoutNormal
    const groupRowCnt = props.flatGroupRowLayouts.length
    const resourceCnt = props.flatResourceLayouts.length
    const rowCnt = groupRowCnt + resourceCnt

    const groupColCnt = props.flatGroupColLayouts.length
    const resourceX = sumPixels(colWidthConfigs.slice(0, groupColCnt))
    const resourceColWidthConfigs = colWidthConfigs.slice(groupColCnt)

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
              minWidth: 0,
              width: colWidthConfigs[colIndex].pixels,
            }}
          >
            {groupColLayouts.map((groupCellLayout) => {
              const group = groupCellLayout.entity
              const groupKey = createGroupId(group)
              const isNotLast = groupCellLayout.rowIndex < groupColLayouts.length - 1
              const rowHeight = rowHeights.get(groupKey)

              return (
                <div
                  key={groupKey}
                  role='row'
                  aria-rowindex={groupCellLayout.rowIndex}
                  class='fc-flex-row fc-fill-x'
                  style={{
                    top: rowTops.get(groupKey),
                    height: (rowHeight != null && isNotLast)
                      ? rowHeight + ROW_BORDER_WIDTH // considering bottom border, which is added to cell
                      : rowHeight,
                  }}
                >
                  <GroupTallCell
                    colSpec={group.spec}
                    fieldValue={group.value}
                    className={joinClassNames(
                      'fc-liquid',
                      isNotLast && 'fc-border-b',
                    )}
                    innerHeightRef={rowInnerHeightRefMap.createRef(groupKey)}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {/* for resource column lines */}
        {resourceColWidthConfigs.map((colWidthConfig, i) => (
          <div
            className={joinClassNames(
              (groupColCnt + i) && 'fc-border-s',
            )}
            style={{
              minWidth: 0,
              width: colWidthConfig.pixels,
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
            const rowHeight = rowHeights.get(resource.id)

            return (
              <div
                key={resource.id}
                role='row'
                aria-rowindex={resourceLayout.rowIndex}
                data-resource-id={resource.id}
                class='fc-flex-row fc-fill-x'
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
                  colWidthConfigs={colWidthConfigs}
                  innerHeightRef={rowInnerHeightRefMap.createRef(resource.id)}
                  className={isNotLast ? 'fc-border-b' : ''}
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
              class={joinClassNames(
                'fc-flex-row fc-fill-x fc-content-box',
                isNotLast && 'fc-border-b',
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
              />
            </div>
          )
        })}
      </div>
    )
  }
}
