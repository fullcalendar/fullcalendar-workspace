import { isEntityGroup } from '../resource/common/resource-hierarchy'
import { type GroupCellLayout, type RowLayout } from './resource-layout'
import { type ItemPosition } from './virtual/virtualizer'

export interface AriaBodyRow {
  layout: RowLayout
  colIndices: Set<number>
}

export interface AriaProxyRowsProps {
  cellIdPrefix: string
  bodyRows: AriaBodyRow[]
  resourceColCnt: number
  superHeaderRowSpan: number
  hasNesting: boolean
}

export function buildAriaCellId(prefix: string, rowIndex: number, colIndex: number): string {
  return `${prefix}-${rowIndex}-${colIndex}`
}

// Renders visually hidden proxy rows that own cells split across the spreadsheet and timeline panes.
// All semantic columns are currently rendered, so browsers infer aria-colcount and aria-colindex.
// If semantic columns are ever omitted or virtualized, add aria-colcount to the grid and
// aria-colindex to the owned cells.
export function AriaProxyRows(props: AriaProxyRowsProps) {
  const {
    cellIdPrefix,
    bodyRows,
    resourceColCnt,
    superHeaderRowSpan,
    hasNesting,
  } = props
  const totalHeaderRowSpan = 1 + superHeaderRowSpan
  const resourceHeaderCellIds = Array.from({ length: resourceColCnt }, (_value, colIndex) => {
    return buildAriaCellId(cellIdPrefix, 1 + superHeaderRowSpan, colIndex)
  })
  const timelineHeaderCellId = buildAriaCellId(cellIdPrefix, 1, resourceColCnt)

  return (
    <div
      role='presentation'
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <div
        role='row'
        aria-rowindex={1}
        aria-owns={superHeaderRowSpan
          ? `${buildAriaCellId(cellIdPrefix, 1, 0)} ${timelineHeaderCellId}`
          : [...resourceHeaderCellIds, timelineHeaderCellId].join(' ')}
      />
      {Boolean(superHeaderRowSpan) && (
        <div
          role='row'
          aria-rowindex={2}
          aria-owns={resourceHeaderCellIds.join(' ')}
        />
      )}
      {bodyRows.map((ariaRow) => {
        const rowLayout = ariaRow.layout
        const rowIndex = 1 + totalHeaderRowSpan + rowLayout.rowIndex

        return (
          <div
            key={rowIndex}
            role='row'
            aria-rowindex={rowIndex}
            aria-level={hasNesting ? 1 + rowLayout.rowDepth : undefined}
            aria-expanded={isEntityGroup(rowLayout.entity) || rowLayout.hasChildren
              ? rowLayout.isExpanded
              : undefined}
            aria-owns={Array.from(ariaRow.colIndices)
              .sort((colIndex0, colIndex1) => colIndex0 - colIndex1)
              .map((colIndex) => buildAriaCellId(cellIdPrefix, rowIndex, colIndex))
              .join(' ')}
          />
        )
      })}
    </div>
  )
}

// Builds proxy body-row ownership from the independently virtualized cell sources.
// Only mounted cells are included, and cells from different panes accumulate on the same logical row.
export function buildAriaBodyRows(
  flatRowLayouts: RowLayout[],
  groupColPositions: ItemPosition<GroupCellLayout>[][],
  rowPositions: ItemPosition<RowLayout>[],
  groupColCnt: number,
  resourceColCnt: number,
): AriaBodyRow[] {
  const ariaBodyRowMap = new Map<number, AriaBodyRow>()

  // Merge a mounted cell into its logical owner row while avoiding duplicate column references.
  const addCell = (rowLayout: RowLayout, colIndex: number) => {
    let ariaRow = ariaBodyRowMap.get(rowLayout.visibleIndex)

    if (!ariaRow) {
      ariaRow = {
        layout: rowLayout,
        colIndices: new Set(),
      }
      ariaBodyRowMap.set(rowLayout.visibleIndex, ariaRow)
    }

    ariaRow.colIndices.add(colIndex)
  }

  // A vertically spanning group-column cell belongs to the first logical row it covers.
  // Its owner row might be outside rowPositions while the spanning cell itself intersects the viewport.
  for (let colIndex = 0; colIndex < groupColPositions.length; colIndex += 1) {
    for (const groupCellPosition of groupColPositions[colIndex]) {
      addCell(flatRowLayouts[groupCellPosition.item.visibleIndex], colIndex)
    }
  }

  // Add cells rendered once per mounted logical row. Group rows have one spreadsheet cell spanning
  // the resource columns; resource rows have one cell per non-group spreadsheet column.
  for (const rowPosition of rowPositions) {
    const rowLayout = rowPosition.item

    if (isEntityGroup(rowLayout.entity)) {
      addCell(rowLayout, 0)
    } else {
      for (let colIndex = groupColCnt; colIndex < resourceColCnt; colIndex += 1) {
        addCell(rowLayout, colIndex)
      }
    }
    // The timeline lane is the final column for both group and resource rows.
    addCell(rowLayout, resourceColCnt)
  }

  // Collection begins with column-group cells, so map insertion order is not necessarily visual order.
  // Proxy-row DOM order must match the visual vertical order.
  return Array.from(ariaBodyRowMap.values()).sort((row0, row1) => {
    return row0.layout.visibleIndex - row1.layout.visibleIndex
  })
}
