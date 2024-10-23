import { createEntityId, Group, Resource } from '@fullcalendar/resource/internal'
import { GenericLayout } from './resource-layout.js'

// Resource/Group Verticals
// -------------------------------------------------------------------------------------------------

export function computeHeights<Entity>(
  siblingNodes: GenericLayout<Entity>[],
  getEntityHeight: (entity: Entity) => number,
  minHeight?: number,
  inbetweenSpace = 0,
): [
  heightMap: Map<Entity, number>,
  totalHeight: number,
] {
  const heightMap = new Map<Entity, number>()
  let [totalHeight, expandableCount] = computeTightHeights(siblingNodes, getEntityHeight, heightMap, inbetweenSpace)

  if (minHeight != null && minHeight > totalHeight) {
    expandHeights(siblingNodes, heightMap, (minHeight - totalHeight) / expandableCount)
    totalHeight = minHeight
  }

  return [heightMap, totalHeight]
}

function computeTightHeights<Entity>(
  siblingNodes: GenericLayout<Entity>[],
  getEntityHeight: (entity: Entity) => number,
  heightMap: Map<Entity, number>,
  inbetweenSpace: number,
): [
  totalHeight: number,
  expandableCount: number,
] {
  let totalHeight = 0
  let expandableCount = 0

  for (const siblingNode of siblingNodes) {
    let ownHeight = getEntityHeight(siblingNode.entity) || 0
    const [childrenHeight, childrenExpandableCount] = computeTightHeights(
      siblingNode.children,
      getEntityHeight,
      heightMap,
      inbetweenSpace
    )

    if (siblingNode.pooledHeight) { // 'own' is side-by-side with children
      if (ownHeight > childrenHeight) {
        // children are smaller. grow them
        expandHeights(
          siblingNode.children,
          heightMap,
          (ownHeight - childrenHeight) / childrenExpandableCount
        )
      } else {
        // own-element is smaller. grow to height of children
        ownHeight = childrenHeight
      }

      totalHeight += ownHeight
    } else { // 'own' is above children
      totalHeight += ownHeight + inbetweenSpace + childrenHeight
    }

    heightMap.set(siblingNode.entity, ownHeight)

    // expandable?
    // vertically stacked, and not a group
    if (siblingNode.pooledHeight === undefined) {
      expandableCount++
    }
    expandableCount += childrenExpandableCount
  }

  return [totalHeight + (siblingNodes.length - 1) * inbetweenSpace, expandableCount]
}

function expandHeights<Entity>(
  siblingNodes: GenericLayout<Entity>[],
  heightMap: Map<Entity, number>,
  expansion: number,
): void {
  for (const siblingNode of siblingNodes) {
    // expandable?
    // vertically stacked, and not a group
    if (siblingNode.pooledHeight === undefined) {
      heightMap.set(siblingNode.entity, heightMap.get(siblingNode.entity) + expansion)
    }

    expandHeights(siblingNode.children, heightMap, expansion)
  }
}

export function computeTopsFromHeights<Entity>(
  siblingNodes: GenericLayout<Entity>[],
  heightMap: Map<Entity, number>,
): Map<Entity, number> {
  const topMap = new Map<Entity, number>()
  computeTopsStartingAt(siblingNodes, heightMap, topMap, 0)
  return topMap
}

function computeTopsStartingAt<Entity>(
  siblingNodes: GenericLayout<Entity>[],
  heightMap: Map<Entity, number>,
  topMap: Map<Entity, number>,
  top: number,
): number { // topAfterwards
  for (const siblingNode of siblingNodes) {
    topMap.set(siblingNode.entity, top)

    if (!siblingNode.pooledHeight) {
      top += heightMap.get(siblingNode.entity)
    }

    top = computeTopsStartingAt(siblingNode.children, heightMap, topMap, top)
  }

  return top
}

export function findEntityByCoord(
  siblingNodes: GenericLayout<Resource | Group>[],
  entityTops: Map<Resource | Group, number>,
  entityHeights: Map<Resource | Group, number>,
  coord: number, // assumed >= 0
): [
  entity: Resource | Group,
  top: number,
  height: number,
] | undefined {
  for (const siblingNode of siblingNodes) {
    const siblingOwnTop = entityTops.get(siblingNode.entity)
    const siblingOwnHeight = entityHeights.get(siblingNode.entity)

    // intersection of the sibling's own element?
    if (siblingOwnTop + siblingOwnHeight > coord) {
      if (siblingNode.pooledHeight) {
        // need more specific result
        return findEntityByCoord(siblingNode.children, entityTops, entityHeights, coord)
      } else {
        return [siblingNode.entity, siblingOwnTop, siblingOwnHeight]
      }
    } else if (!siblingNode.pooledHeight) {
      // search siblings below
      const childrenRes = findEntityByCoord(siblingNode.children, entityTops, entityHeights, coord)
      if (childrenRes) {
        return childrenRes
      }
    }
  }
}

/*
will do b-tree search
TODO: use map in future? or simply to coord lookup by id?
probably, since this is called frequently after rerender
*/
export function findEntityById(
  siblingNodes: GenericLayout<Resource | Group>[],
  id: string,
): Resource | Group | undefined {
  for (const layoutNode of siblingNodes) {
    if (createEntityId(layoutNode.entity) === id) {
      return layoutNode.entity
    }
    const childrenRes = findEntityById(layoutNode.children, id)
    if (childrenRes) {
      return childrenRes
    }
  }
}
