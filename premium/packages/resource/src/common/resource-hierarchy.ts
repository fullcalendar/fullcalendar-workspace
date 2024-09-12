import { compareByFieldSpecs, flexibleCompare, OrderSpec } from '@fullcalendar/core/internal'
import { Resource, ResourceHash } from '../structs/resource.js'
import { GroupSpec } from './resource-spec.js'
import { ResourceApi } from '../public-types.js'

export interface Group { // TODO: move somewhere more general?
  spec: GroupSpec
  value: any
}

// Hierarchy
// -------------------------------------------------------------------------------------------------

export interface GenericNode {
  entity: Resource | Group
  children: GenericNode[]
}

export interface GroupNode extends GenericNode {
  entity: Group
  isCol: boolean
  children: (GroupNode | ResourceNode)[]
}

export interface ResourceNode extends GenericNode {
  entity: Resource
  resourceFields: any
  children: ResourceNode[]
}

type ResourceNodeHash = {
  [resourceId: string]: ResourceNode
}

export function buildResourceHierarchy(
  resourceStore: ResourceHash,
  orderSpecs: OrderSpec<ResourceApi>[],
  groupSpecs: GroupSpec[] = [],
  groupRowDepth: number = 0,
): GenericNode[] {
  let resourceNodeHash = buildResourceNodeHash(resourceStore, orderSpecs)
  let resNodes: GenericNode[] = []

  for (let resourceId in resourceNodeHash) {
    let resourceNode = resourceNodeHash[resourceId]

    if (!resourceNode.entity.parentId) {
      insertResourceNode(resourceNode, orderSpecs, groupSpecs, groupRowDepth, resNodes)
    }
  }

  return resNodes
}

function buildResourceNodeHash(
  resourceStore: ResourceHash,
  orderSpecs: OrderSpec<ResourceApi>[],
): ResourceNodeHash {
  let nodeHash: ResourceNodeHash = {}

  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    nodeHash[resourceId] = {
      entity: resource,
      resourceFields: buildResourceFields(resource),
      children: [],
    }
  }

  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    if (resource.parentId) {
      let parentNode = nodeHash[resource.parentId]

      if (parentNode) {
        insertResourceNodeInSiblings(nodeHash[resourceId], orderSpecs, parentNode.children)
      }
    }
  }

  return nodeHash
}

function insertResourceNode(
  resourceNode: ResourceNode,
  orderSpecs: OrderSpec<ResourceApi>[],
  groupSpecs: GroupSpec[],
  groupRowDepth: number,
  resNodes: GenericNode[],
) {
  if (groupSpecs.length) {
    let groupNode = ensureGroupNodes(resourceNode, groupSpecs[0], groupRowDepth > 0, resNodes)

    insertResourceNode(resourceNode, orderSpecs, groupSpecs.slice(1), groupRowDepth - 1, groupNode.children)
  } else {
    insertResourceNodeInSiblings(resourceNode, orderSpecs, resNodes as ResourceNode[])
  }
}

function ensureGroupNodes(
  resourceNode: ResourceNode,
  groupSpec: GroupSpec,
  isRow: boolean,
  resNodes: GenericNode[],
): GenericNode {
  let groupValue = resourceNode.resourceFields[groupSpec.field]
  let groupNode: GroupNode
  let newGroupIndex: number

  // find an existing group that matches, or determine the position for a new group
  if (groupSpec.order) {
    for (newGroupIndex = 0; newGroupIndex < resNodes.length; newGroupIndex += 1) {
      let node = resNodes[newGroupIndex] as GroupNode
      let group = node.entity
      let cmp = flexibleCompare(groupValue, group.value) * groupSpec.order

      if (cmp === 0) {
        groupNode = node
        break
      } else if (cmp < 0) {
        break
      }
    }
  } else { // the groups are unordered
    for (newGroupIndex = 0; newGroupIndex < resNodes.length; newGroupIndex += 1) {
      let node = resNodes[newGroupIndex] as GroupNode
      let group = node.entity

      if (group && groupValue === group.value) {
        groupNode = node
        break
      }
    }
  }

  if (!groupNode) {
    groupNode = {
      entity: {
        value: groupValue,
        spec: groupSpec,
      },
      isCol: !isRow, // TODO: better names?
      children: [],
    }

    resNodes.splice(newGroupIndex, 0, groupNode)
  }

  return groupNode
}

function insertResourceNodeInSiblings(
  resourceNode: ResourceNode,
  orderSpecs: OrderSpec<ResourceApi>[],
  siblings: ResourceNode[], // like resNodes
) {
  let i: number

  for (i = 0; i < siblings.length; i += 1) {
    let cmp = compareByFieldSpecs( // TODO: pass in ResourceApi?
      siblings[i].resourceFields,
      resourceNode.resourceFields,
      orderSpecs,
    )

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

// Hierarchy + Flattening
// -------------------------------------------------------------------------------------------------

export function flattenResources(
  resourceStore: ResourceHash,
  orderSpecs: OrderSpec<ResourceApi>[],
): Resource[] {
  const hierarchy = buildResourceHierarchy(resourceStore, orderSpecs)
  const resResources: Resource[] = []

  flattenResourceHierarchy(hierarchy as ResourceNode[], resResources)
  return resResources
}

function flattenResourceHierarchy(
  resourceNodes: ResourceNode[],
  resResources: Resource[],
): void {
  for (const node of resourceNodes) {
    resResources.push(node.entity)
    flattenResourceHierarchy(node.children, resResources)
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

export function createEntityId(entity: Resource | Group): string {
  return isEntityGroup(entity) ? createGroupId(entity) : entity.id
}

export function createGroupId(group: Group): string {
  return group.spec.field + ':' + group.value
}

export function isEntityGroup(entity: Resource | Group): entity is Group {
  return Boolean((entity as Group).spec)
}

export function isGroupsEqual(group0: Group, group1: Group) {
  return group0.spec === group1.spec && group0.value === group1.value
}
