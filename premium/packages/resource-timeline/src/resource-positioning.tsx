import { Group, ParentNode, Resource } from '@fullcalendar/resource/internal'
import { ColWidthConfig } from './resource-display.js'

// Spreadsheet Column Widths
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

// Header Verticals (both spreadsheet & time-area)
// -------------------------------------------------------------------------------------------------

export function buildHeaderHeightHierarchy(
  hasSuperHeader: boolean,
  timelineHeaderCnt: number,
): ParentNode<boolean | number>[] {
  // only one spreadsheet header. all timeline headers are height-children
  if (!hasSuperHeader) {
    const children: ParentNode<number>[] = []

    for (let i = 0; i < timelineHeaderCnt; i++) {
      children.push({ entity: i, children: [] })
    }

    return [{
      entity: false, // isSuperHeader?
      children,
    }]
  }

  // only one timeline header. all spreadsheet headers are height-children
  if (timelineHeaderCnt === 1) {
    return [{
      entity: 0, // timelineHeaderIndex
      children: [
        // guaranteed to have super header, or else first `if` would have executed
        { entity: true, children: [] }, // isSuperHeader: true
        { entity: false, children: [] }, // isSuperHeader: false
      ],
    }]
  }

  // otherwise, their are >1 spreadsheet header and >1 timeline header,
  // give leftover timeline header heights to the "super" spreadsheet height

  const children: ParentNode<number>[] = [] // for super-header
  let i: number

  for (i = 0; i < timelineHeaderCnt - 1; i++) {
    children.push({ entity: i, children: [] })
  }

  return [
    { entity: true, children }, // isSuperHeader: true
    { entity: false, children: [{ entity: i, children: [] }] }
  ]
}

// Resource/Group Verticals
// -------------------------------------------------------------------------------------------------

export function buildEntityHeightMap<Entity>(
  heightHierarchy: ParentNode<Entity>[],
  getEntityHeight: (entity: Entity) => number,
  minHeight?: number,
): Map<Entity, number> | undefined { // entityHeights
  return null as any
}

export function findEntityByCoord(
  coord: number,
  heightHierarchy: ParentNode<Resource | Group>[],
  entityHeights: Map<Resource | Group, number>,
): [
  entity: Resource | Group | undefined,
  start: number | undefined,
  size: number | undefined,
] {
  return null as any
}

export function getCoordsByEntity<Entity>(
  entity: Entity,
  entityHeights: Map<Entity, number>,
  heightHierarchy: ParentNode<Entity>[],
): { start: number, size: number } | undefined {
  return null as any
}
