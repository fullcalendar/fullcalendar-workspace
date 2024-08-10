import { OrderSpec } from '@fullcalendar/core/internal'
import { Resource, ResourceHash } from '../structs/resource.js'
import { GroupSpec } from './resource-spec.js'
import { ResourceApi } from '../public-types.js'

export interface Group {
  spec: GroupSpec
  value: any
}

export interface ParentNode<Entity> {
  entity: Entity
  children: ParentNode<Entity>[]
}

export function buildResourceHierarchy(
  resourceStore: ResourceHash,
  groupSpecs: GroupSpec[],
  orderSpecs: OrderSpec<ResourceApi>[],
): ParentNode<Resource | Group>[] {
  return null as any
  // buildHierarchy below
}

export function isEntityGroup(entity: Resource | Group): entity is Group {
  return Boolean((entity as Group).spec)
}

export function createGroupId(group: Group): string { // TODO: kill
  return group.spec.field + ':' + group.value
}

export function isGroupsEqual(group0: Group, group1: Group) {
  return group0.spec === group1.spec && group0.value === group1.value
}

export function flattenResources(resourceStore: ResourceHash, orderSpecs: OrderSpec<ResourceApi>[]): Resource[] {
  const hierarchy = buildResourceHierarchy(resourceStore, [], orderSpecs)
  return flattenHierarchy(hierarchy) as Resource[]
}

function flattenHierarchy(hierarchy: ParentNode<Resource | Group>[]): (Resource | Group)[] {
  return null as any
  // flattenNodes below
}

/*
function buildHierarchy(
  resourceStore: ResourceHash,
  maxDepth: number,
  groupSpecs: GroupSpec[],
  orderSpecs: OrderSpec<ResourceApi>[],
): ParentNode[] {
  let resourceNodes = buildResourceNodes(resourceStore, orderSpecs)
  let builtNodes: ParentNode[] = []

  for (let resourceId in resourceNodes) {
    let resourceNode = resourceNodes[resourceId]

    if (!resourceNode.resource.parentId) {
      insertResourceNode(resourceNode, builtNodes, groupSpecs, 0, maxDepth, orderSpecs)
    }
  }

  return builtNodes
}

function buildResourceNodes(resourceStore: ResourceHash, orderSpecs: OrderSpec<ResourceApi>[]): ResourceNodeHash {
  let nodeHash: ResourceNodeHash = {}

  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    nodeHash[resourceId] = {
      resource,
      resourceFields: buildResourceFields(resource),
      children: [],
    }
  }

  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    if (resource.parentId) {
      let parentNode = nodeHash[resource.parentId]

      if (parentNode) {
        insertResourceNodeInSiblings(nodeHash[resourceId], parentNode.children, orderSpecs)
      }
    }
  }

  return nodeHash
}

function insertResourceNode(
  resourceNode: ResourceParentNode,
  nodes: ParentNode[],
  groupSpecs: GroupSpec[],
  depth: number,
  maxDepth: number, // used???
  orderSpecs: OrderSpec<ResourceApi>[],
) {
  if (groupSpecs.length && (maxDepth === -1 || depth <= maxDepth)) {
    let groupNode = ensureGroupNodes(resourceNode, nodes, groupSpecs[0])

    insertResourceNode(resourceNode, groupNode.children, groupSpecs.slice(1), depth + 1, maxDepth, orderSpecs)
  } else {
    insertResourceNodeInSiblings(resourceNode, nodes, orderSpecs)
  }
}

function ensureGroupNodes(resourceNode: ResourceParentNode, nodes: ParentNode[], groupSpec: GroupSpec): GroupParentNode {
  let groupValue = resourceNode.resourceFields[groupSpec.field]
  let groupNode
  let newGroupIndex

  // find an existing group that matches, or determine the position for a new group
  if (groupSpec.order) {
    for (newGroupIndex = 0; newGroupIndex < nodes.length; newGroupIndex += 1) {
      let node = nodes[newGroupIndex]

      if ((node as GroupParentNode).group) {
        let cmp = flexibleCompare(groupValue, (node as GroupParentNode).group.value) * groupSpec.order

        if (cmp === 0) {
          groupNode = node
          break
        } else if (cmp < 0) {
          break
        }
      }
    }
  } else { // the groups are unordered
    for (newGroupIndex = 0; newGroupIndex < nodes.length; newGroupIndex += 1) {
      let node = nodes[newGroupIndex]

      if ((node as GroupParentNode).group && groupValue === (node as GroupParentNode).group.value) {
        groupNode = node
        break
      }
    }
  }

  if (!groupNode) {
    groupNode = {
      group: {
        value: groupValue,
        spec: groupSpec,
      },
      children: [],
    }

    nodes.splice(newGroupIndex, 0, groupNode)
  }

  return groupNode
}

function insertResourceNodeInSiblings(resourceNode, siblings, orderSpecs: OrderSpec<ResourceApi>[]) {
  let i

  for (i = 0; i < siblings.length; i += 1) {
    let cmp = compareByFieldSpecs(siblings[i].resourceFields, resourceNode.resourceFields, orderSpecs) // TODO: pass in ResourceApi?

    if (cmp > 0) { // went 1 past. insert at i
      break
    }
  }

  siblings.splice(i, 0, resourceNode)
}

function buildResourceFields(resource: Resource): any {
  let obj = { ...resource.extendedProps, ...resource.ui, ...resource }

  delete obj.ui
  delete obj.extendedProps

  return obj
}
*/

/*
function flattenNodes(
  complexNodes: ParentNode[],
  res, isVGrouping, rowSpans, depth,
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
) {
  for (let i = 0; i < complexNodes.length; i += 1) {
    let complexNode = complexNodes[i]
    let group = (complexNode as GroupParentNode).group

    if (group) {
      if (isVGrouping) {
        let firstRowIndex = res.length
        let rowSpanIndex = rowSpans.length

        flattenNodes(complexNode.children, res, isVGrouping, rowSpans.concat(0), depth, expansions, expansionDefault)

        if (firstRowIndex < res.length) {
          let firstRow = res[firstRowIndex]
          let firstRowSpans = firstRow.rowSpans = firstRow.rowSpans.slice()

          firstRowSpans[rowSpanIndex] = res.length - firstRowIndex
        }
      } else {
        let id = group.spec.field + ':' + group.value
        let isExpanded = expansions[id] != null ? expansions[id] : expansionDefault

        res.push({ id, group, isExpanded })

        if (isExpanded) {
          flattenNodes(complexNode.children, res, isVGrouping, rowSpans, depth + 1, expansions, expansionDefault)
        }
      }
    } else if ((complexNode as ResourceParentNode).resource) {
      let id = (complexNode as ResourceParentNode).resource.id
      let isExpanded = expansions[id] != null ? expansions[id] : expansionDefault

      res.push({
        id,
        rowSpans,
        depth,
        isExpanded,
        hasChildren: Boolean(complexNode.children.length),
        resource: (complexNode as ResourceParentNode).resource,
        resourceFields: (complexNode as ResourceParentNode).resourceFields,
      })

      if (isExpanded) {
        flattenNodes(complexNode.children, res, isVGrouping, rowSpans, depth + 1, expansions, expansionDefault)
      }
    }
  }
}
*/
