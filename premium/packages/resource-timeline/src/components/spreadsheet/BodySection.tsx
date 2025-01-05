import { BaseComponent, joinClassNames, RefMap } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { ColSpec, createGroupId } from "@fullcalendar/resource/internal"
import { GroupTallCell } from "./GroupTallCell.js"
import { GroupWideCell } from "./GroupWideCell.js"
import { ResourceCells } from "./ResourceCells.js"
import { generateGroupLabelIds, GroupCellLayout, GroupRowLayout, ResourceLayout } from "../../resource-layout.js"
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
  hierarchyDomIdScope: string
  colDomIdScope: string
  hasSuperHeader: boolean
}

/*
Takes up no vertical space. Fills itself within outer container.
Caller is responsible for this.
*/
export class BodySection extends BaseComponent<BodySectionProps> {
  render() {
    const { props, context } = this
    const { rowInnerHeightRefMap, rowTops, rowHeights, headerRowSpan } = props

    // TODO: less-weird way to get this! more DRY with ResourceTimelineLayoutNormal
    const groupRowCnt = props.flatGroupRowLayouts.length
    const resourceCnt = props.flatResourceLayouts.length
    const rowCnt = groupRowCnt + resourceCnt

    const groupColCnt = props.flatGroupColLayouts.length

    const colWidths = props.colWidths || []
    const resourceX = sumArray(colWidths.slice(0, groupColCnt))
    const resourceColWidths = colWidths.slice(groupColCnt)

    /*
    TODO: simplify DOM structure to be more like time-area?
    where an actual DIV creates the mass, not a paddingTop
    */
    return (
      <div role='rowgroup' className='fc-flex-row fc-fill'>

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
                    rowSpan={groupCellLayout.rowSpan}
                    fieldValue={group.value}
                    className={joinClassNames(
                      'fc-liquid',
                      isNotLast && 'fc-border-b',
                    )}
                    labelIds={joinClassNames( // abuse
                      props.hasSuperHeader && props.colDomIdScope, // super header
                      props.colDomIdScope != null && props.colDomIdScope + '-' + groupIndex,
                    )}
                    domId={props.hierarchyDomIdScope + '-' + groupCellLayout.indexes.join('-')}
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
            className={joinClassNames(
              (groupColCnt + i) && 'fc-border-s',
            )}
            style={{
              minWidth: 0,
              width: colWidth,
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
                aria-rowindex={1 + headerRowSpan + resourceLayout.rowIndex}
                aria-level={1 + resourceLayout.depth}
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
                  colWidths={colWidths}
                  innerHeightRef={rowInnerHeightRefMap.createRef(resource.id)}
                  className={isNotLast ? 'fc-border-b' : ''}
                  hierarchyLabelIds={joinClassNames( // abuse
                    props.hasSuperHeader && props.colDomIdScope, // super header
                    generateGroupLabelIds(props.hierarchyDomIdScope, resourceLayout.parentGroupIndexes),
                  )}
                  domId={props.hierarchyDomIdScope + '-' + resourceLayout.indexes.join('-')}
                  colDomIdScope={props.colDomIdScope}
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
              aria-rowindex={1 + headerRowSpan + groupRowLayout.rowIndex}
              aria-level={1 + groupRowLayout.depth}
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
                colSpan={props.colSpecs.length}
                domId={props.hierarchyDomIdScope + '-' + groupRowLayout.indexes.join('-')}
              />
            </div>
          )
        })}
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
