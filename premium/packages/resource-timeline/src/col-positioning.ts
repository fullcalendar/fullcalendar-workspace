
// Config
// -------------------------------------------------------------------------------------------------

export interface ColWidthConfig {
  pixels?: number
  frac?: number
}

export function parseColWidthConfig(width: number | string): ColWidthConfig {
  if (width != null) {
    if (typeof width === 'string') {
      const m = width.match(/^(.*)%$/)
      if (m) {
        const numerator = parseFloat(m[0])
        if (!isNaN(numerator)) {
          return { frac: numerator / 100 }
        } else {
          return {}
        }
      } else {
        width = parseFloat(width)
        if (isNaN(width)) {
          return {}
        }
      }
    }
    if (typeof width === 'number') {
      return { pixels: width }
    }
    return {}
  }
}

export function isColWidthConfigListsEqual(a: ColWidthConfig[], b: ColWidthConfig[]): boolean {
  const { length } = a

  if (b.length !== length) {
    return false
  }

  for (let i = 0; i < length; i++) {
    if (a[i].frac !== b[i].frac || a[i].pixels !== b[i].pixels) {
      return false
    }
  }

  return true
}

// Size Computations
// -------------------------------------------------------------------------------------------------

export const SPREADSHEET_COL_MIN_WIDTH = 20

export function processSpreadsheetColWidthConfigs(
  colWidthConfigs: ColWidthConfig[],
  availableWidth: number | undefined
): [colWidths: number[], totalWidth: number] {
  let colWidths: number[] = []
  let totalWidth = 0
  let fracDenom = 0

  // consume pixel-based width first
  for (const c of colWidthConfigs) {
    if (c.frac != null) {
      colWidths.push(0)
      fracDenom += c.frac
    } else {
      const w = Math.max(c.pixels, SPREADSHEET_COL_MIN_WIDTH)
      colWidths.push(w)
      totalWidth += w
    }
  }

  const leftoverWidth = Math.max(0, availableWidth - totalWidth)
  let i = 0

  // leftover width goes to frac-based width
  for (const c of colWidthConfigs) {
    if (c.frac != null) {
      const w = Math.max(c.frac / fracDenom * leftoverWidth, SPREADSHEET_COL_MIN_WIDTH)
      colWidths[i] = w
      totalWidth += w
    }
    i++
  }

  return [colWidths, totalWidth]
}

export function processSpreadsheetColWidthOverrides(
  colWidthOverrides: number[], // already ensured >= SPREADSHEET_COL_MIN_WIDTH
  availableWidth: number | undefined,
): [colWidth: number[], totalWidth: number] {
  let colWidths: number[] = []
  let totalWidth = 0

  for (const w of colWidthOverrides) {
    colWidths.push(w)
    totalWidth += w
  }

  if (totalWidth < availableWidth) {
    colWidths[colWidthOverrides.length - 1] += (availableWidth - totalWidth)
    totalWidth = availableWidth
  }

  return [colWidths, totalWidth]
}

export function sliceSpreadsheetColWidth(
  colWidths: number[],
  startIndex: number
): number | undefined {
  if (colWidths.length) {
    let total = 0

    for (let i = startIndex; i < colWidths.length; i++) {
      total += colWidths[i]
    }

    return total
  }
}
