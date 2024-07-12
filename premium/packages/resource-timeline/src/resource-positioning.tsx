import { ColSpec, Group, ParentNode, Resource } from '@fullcalendar/resource/internal'
import { CoordRange } from '@fullcalendar/timeline/internal'

// Spreadsheet Column Widths
// -------------------------------------------------------------------------------------------------

export function computeSpreadsheetColHorizontals(
  colSpecs: ColSpec[],
  forcedWidths: number[],
  availableWidth: number | undefined
): [CoordRange[], number] {
  return null as any
}

export function sliceSpreadsheetColHorizontal(
  colPositions: CoordRange[],
  startIndex: number
): CoordRange | undefined {
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
  entityNaturalHeights: Map<Entity, number> | undefined,
  minHeight?: number,
): [
  coordRanges: Map<Entity, CoordRange> | undefined,
  totalSize: number | undefined
] {
  return null as any
}

export function findEntityByCoord(
  coord: number,
  coordHierarchy: ParentNode<Resource | Group>[],
  coordRanges: Map<Resource | Group, CoordRange>,
): Resource | Group | undefined {
  return null as any
}
