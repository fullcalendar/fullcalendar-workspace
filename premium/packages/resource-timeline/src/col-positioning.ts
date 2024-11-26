
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
  }
  return {}
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
): [colWidths: number[], totalWidth: number | undefined] {
  if (availableWidth == null) {
    return [[], undefined]
  }

  let colWidths: number[] = []
  let totalWidth = 0
  let fracDenom = 0
  let numFracCols = 0
  let numUnknownFracCols = 0

  // consume pixel-based width first
  for (const c of colWidthConfigs) {
    if (c.pixels != null) {
      const w = Math.max(c.pixels, SPREADSHEET_COL_MIN_WIDTH)
      colWidths.push(w)
      totalWidth += w
    } else {
      colWidths.push(0)
      numFracCols++

      if (c.frac != null) {
        fracDenom += c.frac
      } else {
        numUnknownFracCols++
      }
    }
  }

  const defaultFrac = 1 / numFracCols
  fracDenom += numUnknownFracCols * defaultFrac

  const leftoverWidth = Math.max(0, availableWidth - totalWidth)
  let i = 0

  // leftover width goes to frac-based width
  for (const c of colWidthConfigs) {
    if (c.pixels == null) {
      const frac = c.frac ?? defaultFrac
      const w = Math.max(frac / fracDenom * leftoverWidth, SPREADSHEET_COL_MIN_WIDTH)
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
): [colWidth: number[], totalWidth: number | undefined] {
  if (availableWidth == null) {
    return [[], undefined]
  }

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
  startIndex: number,
  endIndex = colWidths.length
): number | undefined {
  if (colWidths.length) {
    let total = 0

    for (let i = startIndex; i < endIndex; i++) {
      total += colWidths[i]
    }

    return total
  }
}
