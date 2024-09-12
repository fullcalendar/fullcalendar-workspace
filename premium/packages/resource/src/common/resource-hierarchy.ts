import { compareByFieldSpecs, flexibleCompare, OrderSpec } from '@fullcalendar/core/internal'
import { Resource, ResourceHash } from '../structs/resource.js'
import { GroupSpec } from './resource-spec.js'
import { ResourceApi } from '../public-types.js'

export interface Group {
  spec: GroupSpec
  value: any
}

// Hierarchy
// -------------------------------------------------------------------------------------------------

export interface ParentNode<Entity> {
  entity: Entity
  children: ParentNode<Entity>[]
}

interface ResourceNode extends ParentNode<Resource> {
  entityFields: any
  children: ResourceNode[]
}

type ResourceNodeHash = {
  [resourceId: string]: ResourceNode
}

export function buildResourceHierarchy(
  resourceStore: ResourceHash,
  groupSpecs: GroupSpec[],
  orderSpecs: OrderSpec<ResourceApi>[],
): ParentNode<Resource | Group>[] {
  let resourceNodes = buildResourceNodes(resourceStore, orderSpecs)
  let resNodes: ParentNode<Resource | Group>[] = []

  for (let resourceId in resourceNodes) {
    let resourceNode = resourceNodes[resourceId]

    if (!resourceNode.entity.parentId) {
      insertResourceNode(resourceNode, resNodes, groupSpecs, orderSpecs)
    }
  }

  return resNodes
}

function buildResourceNodes(
  resourceStore: ResourceHash,
  orderSpecs: OrderSpec<ResourceApi>[],
): ResourceNodeHash {
  let nodeHash: ResourceNodeHash = {}

  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    nodeHash[resourceId] = {
      entity: resource,
      entityFields: buildResourceFields(resource),
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
  resourceNode: ResourceNode,
  resNodes: ParentNode<Resource | Group>[],
  groupSpecs: GroupSpec[],
  orderSpecs: OrderSpec<ResourceApi>[],
) {
  if (groupSpecs.length) {
    let groupNode = ensureGroupNodes(resourceNode, resNodes as ParentNode<Group>[], groupSpecs[0])

    insertResourceNode(resourceNode, groupNode.children, groupSpecs.slice(1), orderSpecs)
  } else {
    insertResourceNodeInSiblings(resourceNode, resNodes as ResourceNode[], orderSpecs)
  }
}

function ensureGroupNodes(
  resourceNode: ResourceNode,
  resNodes: ParentNode<Group>[],
  groupSpec: GroupSpec,
): ParentNode<Group> {
  let groupValue = resourceNode.entityFields[groupSpec.field]
  let groupNode: ParentNode<Group>
  let newGroupIndex: number

  // find an existing group that matches, or determine the position for a new group
  if (groupSpec.order) {
    for (newGroupIndex = 0; newGroupIndex < resNodes.length; newGroupIndex += 1) {
      let node = resNodes[newGroupIndex]
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
      let node = resNodes[newGroupIndex]
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
      children: [],
    }

    resNodes.splice(newGroupIndex, 0, groupNode)
  }

  return groupNode
}

function insertResourceNodeInSiblings(
  resourceNode: ResourceNode,
  siblings: ResourceNode[],
  orderSpecs: OrderSpec<ResourceApi>[],
) {
  let i: number

  for (i = 0; i < siblings.length; i += 1) {
    let cmp = compareByFieldSpecs( // TODO: pass in ResourceApi?
      siblings[i].entityFields,
      resourceNode.entityFields,
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
  const hierarchy = buildResourceHierarchy(resourceStore, [], orderSpecs)
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
