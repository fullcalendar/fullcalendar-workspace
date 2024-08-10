import { ColSpec, Group, ParentNode, Resource } from '@fullcalendar/resource/internal'

// Spreadsheet Column Widths
// -------------------------------------------------------------------------------------------------

export function computeSpreadsheetColHorizontals(
  colSpecs: ColSpec[],
  forcedWidths: number[],
  availableWidth: number | undefined
): [widths: number[], totalWidth: number] {
  return null as any
}

export function sliceSpreadsheetColHorizontal(
  colWidths: number[],
  startIndex: number
): number | undefined {
  return null as any
}

// Header Verticals (both spreadsheet & time-area)
// -------------------------------------------------------------------------------------------------

export function buildHeaderCoordHierarchy(
  hasSuperHeader: boolean,
  timelineHeaderCnt: number,
): ParentNode<boolean | number>[] {
  return null as any
}

// Resource/Group Verticals
// -------------------------------------------------------------------------------------------------

export function buildEntityCoordRanges<Entity>(
  coordHierarchy: ParentNode<Entity>[],
  getEntityHeight: (entity: Entity) => number,
  minHeight?: number,
): Map<Entity, number> | undefined { // entityHeights
  return null as any
}

export function findEntityByCoord(
  coord: number,
  coordHierarchy: ParentNode<Resource | Group>[],
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
  coordHierarchy: ParentNode<Entity>[],
): { start: number, size: number } | undefined {
  return null as any
}
