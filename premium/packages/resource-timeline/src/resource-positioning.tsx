import { createEntityId, Group, Resource } from '@fullcalendar/resource/internal'
import { GenericLayout } from './resource-layout.js'

export const ROW_BORDER_WIDTH = 1

// Resource/Group Verticals
// -------------------------------------------------------------------------------------------------

export function computeHeights<Entity, Key>(
  siblingNodes: GenericLayout<Entity>[],
  getEntityKey: (entity: Entity) => Key,
  getEntityHeight: (entityKey: Key) => number,
  minHeight?: number,
): [
  heightMap: Map<Key, number>,
  totalHeight: number,
] {
  const heightMap = new Map<Key, number>()
  let [totalHeight, expandableCount] = computeTightHeights(
    siblingNodes,
    getEntityKey,
    getEntityHeight,
    heightMap,
  )

  if (minHeight != null && minHeight > totalHeight) {
    expandHeights(siblingNodes, getEntityKey, heightMap, (minHeight - totalHeight) / expandableCount)
    totalHeight = minHeight
  }

  return [heightMap, totalHeight]
}

function computeTightHeights<Entity, Key>(
  siblingNodes: GenericLayout<Entity>[],
  getEntityKey: (entity: Entity) => Key,
  getEntityHeight: (entityKey: Key) => number,
  heightMap: Map<Key, number>,
): [
  totalHeight: number,
  expandableCount: number,
] {
  let totalHeight = 0
  let expandableCount = 0

  for (const siblingNode of siblingNodes) {
    const entityKey = getEntityKey(siblingNode.entity)

    let ownHeight = getEntityHeight(entityKey) || 0
    const [childrenHeight, childrenExpandableCount] = computeTightHeights(
      siblingNode.children,
      getEntityKey,
      getEntityHeight,
      heightMap,
    )

    if (siblingNode.pooledHeight) { // 'own' is side-by-side with children
      if (ownHeight > childrenHeight) {
        // children are smaller. grow them
        expandHeights(
          siblingNode.children,
          getEntityKey,
          heightMap,
          (ownHeight - childrenHeight) / childrenExpandableCount
        )
      } else {
        // own-element is smaller. grow to height of children
        ownHeight = childrenHeight
      }

      totalHeight += ownHeight
    } else { // 'own' is above children
      totalHeight += ownHeight + ROW_BORDER_WIDTH + childrenHeight
    }

    heightMap.set(entityKey, ownHeight)

    // expandable?
    // vertically stacked, and not a group
    if (siblingNode.pooledHeight === undefined) {
      expandableCount++
    }
    expandableCount += childrenExpandableCount
  }

  return [
    totalHeight + ROW_BORDER_WIDTH * (siblingNodes.length - 1),
    expandableCount,
  ]
}

function expandHeights<Entity, Key>(
  siblingNodes: GenericLayout<Entity>[],
  getEntityKey: (entity: Entity) => Key,
  heightMap: Map<Key, number>,
  expansion: number,
): void {
  for (const siblingNode of siblingNodes) {
    // expandable?
    // vertically stacked, and not a group
    if (siblingNode.pooledHeight === undefined) {
      const entityKey = getEntityKey(siblingNode.entity)
      heightMap.set(entityKey, heightMap.get(entityKey) + expansion)
    }

    expandHeights(siblingNode.children, getEntityKey, heightMap, expansion)
  }
}

export function computeTopsFromHeights<Entity, Key>(
  siblingNodes: GenericLayout<Entity>[],
  getEntityKey: (entity: Entity) => Key,
  heightMap: Map<Key, number>,
): Map<Key, number> {
  const topMap = new Map<Key, number>()
  computeTopsStartingAt(siblingNodes, getEntityKey, heightMap, topMap, 0)
  return topMap
}

function computeTopsStartingAt<Entity, Key>(
  siblingNodes: GenericLayout<Entity>[],
  getEntityKey: (entity: Entity) => Key,
  heightMap: Map<Key, number>,
  topMap: Map<Key, number>,
  top: number,
): number { // topAfterwards
  for (let i = 0; i < siblingNodes.length; i++) {
    const siblingNode = siblingNodes[i]
    const entityKey = getEntityKey(siblingNode.entity)
    topMap.set(entityKey, top)

    if (!siblingNode.pooledHeight) {
      top += heightMap.get(entityKey) + ROW_BORDER_WIDTH
    }

    top = computeTopsStartingAt(siblingNode.children, getEntityKey, heightMap, topMap, top)
  }

  return top
}

export function findEntityByCoord(
  siblingNodes: GenericLayout<Resource | Group>[],
  entityTops: Map<string, number>, // keyed by createEntityId
  entityHeights: Map<string, number>, // keyed by createEntityId
  coord: number, // assumed >= 0
): [
  entity: Resource | Group,
  top: number,
  height: number,
] | undefined {
  for (const siblingNode of siblingNodes) {
    const entityKey = createEntityId(siblingNode.entity)
    const siblingOwnTop = entityTops.get(entityKey)
    const siblingOwnHeight = entityHeights.get(entityKey)

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
