import { dayMicroWidth } from './day-header-format'

/*
DayGrid's column widths and cell density, shared by the screen layouts and print
*/

export function computeColWidth(colCount: number, colMinWidth: number, viewportWidth: number | undefined): [
  canvasWidth: number | undefined, // does NOT include scrollbar gutter
  appliedColWidth: number | undefined,
] {
  if (viewportWidth == null) {
    return [undefined, undefined]
  }

  const colTempWidth = viewportWidth / colCount

  if (colTempWidth < colMinWidth) {
    return [colMinWidth * colCount, colMinWidth]
  }

  return [viewportWidth, undefined]
}

export interface CellDensity {
  cellIsNarrow: boolean
  cellIsMicro: boolean
}

// see planning/hook-toolkit-spec.md §4.5
export function computeCellDensity(
  cellWidth: number | undefined,
  options: { dayNarrowWidth?: number },
): CellDensity {
  const cellIsMicro = cellWidth != null && cellWidth <= dayMicroWidth
  const cellIsNarrow = cellIsMicro || (cellWidth != null && cellWidth <= options.dayNarrowWidth)
  return { cellIsNarrow, cellIsMicro }
}

export interface DayGridColumns extends CellDensity {
  canvasWidth: number | undefined // only when columns are wider than the viewport allows
  appliedColWidth: number | undefined // "
}

// the column sizing shared by the screen layouts and print, which reuses the screen measurements
export function computeDayGridColumns(
  colCount: number,
  clientWidth: number | undefined,
  dayMinWidth: number | undefined,
  options: { dayNarrowWidth?: number },
): DayGridColumns {
  const [canvasWidth, appliedColWidth] = dayMinWidth
    ? computeColWidth(colCount, dayMinWidth, clientWidth)
    : [undefined, undefined]
  const measuredColWidth = appliedColWidth ?? (clientWidth != null ? clientWidth / colCount : undefined)

  return {
    canvasWidth,
    appliedColWidth,
    ...computeCellDensity(measuredColWidth, options),
  }
}
