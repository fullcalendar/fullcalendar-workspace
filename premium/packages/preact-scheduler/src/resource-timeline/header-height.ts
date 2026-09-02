import { ROW_BORDER_WIDTH } from '@full-ui/headless-grid'

export function computeResourceTimelineHeaderHeight(
  dataGridHeaderRowInnerHeightMap: Map<boolean, number>,
  timelineHeaderRowInnerHeightMap: Map<number, number>,
  hasDataGridSuperHeader: boolean,
  timelineHeaderRowCnt: number,
): number | undefined {
  const dataGridKeys: boolean[] = (hasDataGridSuperHeader ? [true] : []).concat(false)
  let dataGridHeight = 0

  for (const key of dataGridKeys) {
    const rowHeight = dataGridHeaderRowInnerHeightMap.get(key)

    if (rowHeight == null) {
      return
    }

    dataGridHeight += rowHeight
  }

  let timelineHeight = 0

  for (let rowIndex = 0; rowIndex < timelineHeaderRowCnt; rowIndex += 1) {
    const rowHeight = timelineHeaderRowInnerHeightMap.get(rowIndex)

    if (rowHeight == null) {
      return
    }

    timelineHeight += rowHeight
  }

  return Math.max(
    dataGridHeight + (hasDataGridSuperHeader ? ROW_BORDER_WIDTH : 0),
    timelineHeight + ROW_BORDER_WIDTH * (timelineHeaderRowCnt - 1),
  )
}
