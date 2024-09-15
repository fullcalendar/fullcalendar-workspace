import { createEntityId, Group, Resource } from '@fullcalendar/resource/internal'
import { GenericLayout, ResourceLayout } from './resource-layout.js'

// Resource/Group Verticals
// -------------------------------------------------------------------------------------------------
// TODO: can start calling everything 'height'

export type Coords = [start: number, size: number] // TODO: elsewhere?

export function buildEntityCoords<Entity>(
  hierarchy: GenericLayout<Entity>[],
  getEntityHeight: (entity: Entity) => number,
  minHeight?: number,
): Map<Entity, Coords> {
  const coords = new Map<Entity, Coords>()
  let currentTop = 0
  let resourceCnt = 0
  let extraPerResource = 0

  function processNodes(layoutNodes: GenericLayout<Entity>[]): number { // returns total height
    let totalHeight = 0

    for (const layoutNode of layoutNodes) {
      const ownHeight = getEntityHeight(layoutNode.entity)

      if (ownHeight != null) {
        const childrenHeight = processNodes(layoutNode.children)

        if (childrenHeight != null) {
          let layoutNodeHeight = layoutNode.isCol
            ? Math.max(ownHeight, childrenHeight)
            : ownHeight + childrenHeight

          // is a resource?
          if ((layoutNode as any as ResourceLayout).resourceFields != null) { // !!!
            resourceCnt++
            layoutNodeHeight += extraPerResource
          }

          coords.set(layoutNode.entity, [currentTop, layoutNodeHeight])
          currentTop += layoutNodeHeight
          totalHeight += layoutNodeHeight
        }
      }
    }

    return totalHeight
  }

  const initialTotalHeight = processNodes(hierarchy)

  if (minHeight != null && initialTotalHeight < minHeight) {
    currentTop = 0
    resourceCnt = 0
    extraPerResource = (minHeight - initialTotalHeight) / resourceCnt
    processNodes(hierarchy)
  }

  return coords
}

export function findEntityByCoord(
  hierarchy: GenericLayout<Resource | Group>[],
  entityCoords: Map<Resource | Group, Coords>,
  coord: number, // assumed >= 0
): [
  entity: Resource | Group | undefined,
  start: number | undefined,
  size: number | undefined,
] {
  for (const layoutNode of hierarchy) {
    const res = entityCoords.get(layoutNode.entity)

    if (res) {
      const [start, size] = res

      // intersection?
      if (start + size > coord) {
        // group column? get more specific
        if (layoutNode.isCol) {
          return findEntityByCoord(layoutNode.children, entityCoords, coord - start)
        } else {
          return [layoutNode.entity, start, size]
        }
      }
    }
  }
  return [undefined, undefined, undefined]
}

/*
will do b-tree search
TODO: use map in future? or simply to coord lookup by id?
probably, since this is called frequently after rerender
*/
export function findEntityById(
  hierarchy: GenericLayout<Resource | Group>[],
  id: string,
): Resource | Group | undefined {
  for (const layoutNode of hierarchy) {
    if (createEntityId(layoutNode.entity) === id) {
      return layoutNode.entity
    }
    const childrenRes = findEntityById(layoutNode.children, id)
    if (childrenRes) {
      return childrenRes
    }
  }
}
