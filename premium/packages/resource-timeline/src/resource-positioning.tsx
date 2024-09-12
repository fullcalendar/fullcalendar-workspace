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
