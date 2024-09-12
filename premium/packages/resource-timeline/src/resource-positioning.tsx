import { Group, Resource } from '@fullcalendar/resource/internal'
import { GenericLayout } from './resource-layout.js'

// Resource/Group Verticals
// -------------------------------------------------------------------------------------------------

export type Coords = [start: number, size: number] // TODO: elsewhere?

export function buildEntityCoords<Entity>(
  hierarchy: GenericLayout<Entity>[],
  getEntityHeight: (entity: Entity) => number,
  minHeight?: number,
): Map<Entity, Coords> | undefined {
  return null as any
}

/*
will do b-tree search
*/
export function findEntityByCoord(
  hierarchy: GenericLayout<Resource | Group>[],
  entityCoordMap: Map<Resource | Group, Coords>,
  coord: number,
): [
  entity: Resource | Group | undefined,
  start: number | undefined,
  size: number | undefined,
] {
  return null as any
}

/*
will do b-tree search
TODO: use map in future? or simply to coord lookup by id?
*/
export function findEntityById(
  hierarchy: GenericLayout<Resource | Group>[],
  id: string,
): Resource | Group {
  return null as any
}

// Spreadsheet Column Widths
// -------------------------------------------------------------------------------------------------

export const SPREADSHEET_COL_MIN_WIDTH = 20

export interface ColWidthConfig {
  pixels?: number
  frac?: number
}

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
