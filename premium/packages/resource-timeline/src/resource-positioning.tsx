import { Group, ParentNode, Resource } from '@fullcalendar/resource/internal'
import { ColWidthConfig } from './resource-display.js'

// Spreadsheet Column Widths
// -------------------------------------------------------------------------------------------------

export const SPREADSHEET_COL_MIN_WIDTH = 20

export function processSpreadsheetColWidthConfigs(
  colWidthConfigs: ColWidthConfig[],
  availableWidth: number | undefined
): [colWidths: number[], totalWidth: number] {
  return null as any
}

export function processSpreadsheetColWidthOverrides(
  colWidthOverrides: number[],
  availableWidth: number | undefined,
): [colWidth: number[], totalWidth: number] {
  return null as any
}

export function sliceSpreadsheetColWidth(
  colWidths: number[],
  startIndex: number
): number | undefined {
  return null as any
}

// Header Verticals (both spreadsheet & time-area)
// -------------------------------------------------------------------------------------------------

export function buildHeaderHeightHierarchy(
  hasSuperHeader: boolean,
  timelineHeaderCnt: number,
): ParentNode<boolean | number>[] {
  return null as any
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
