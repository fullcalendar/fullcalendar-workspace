import { compareByFieldSpecs, flexibleCompare, OrderSpec } from '@fullcalendar/core/internal'
import { Resource, ResourceHash } from '../structs/resource.js'
import { ResourceApi } from '../public-types.js'

interface GenericGroupSpec { // best place for this?
  field?: string
  order?: number
}

export interface Group { // TODO: move somewhere more general?
  spec: GenericGroupSpec
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
  pooledHeight: boolean // does the 'own' node share height with the children?
  children: (GroupNode | ResourceNode)[]
}

export interface ResourceNode extends GenericNode {
  entity: Resource
  resourceFields: any
  children: ResourceNode[]
}

export type ResourceNodeHash = {
  [resourceId: string]: ResourceNode
}

/*
TODO: move away from pooledHeight. simply create child-parent relationships w/ groups+resource
The groups that are row-groups VS col-groups can be determined by colGroupDepth
*/
export function buildResourceHierarchy(
  resourceStore: ResourceHash,
  orderSpecs: OrderSpec<ResourceApi>[], // why accepted when resourceNodeHash already ordered?
  groupSpecs: GenericGroupSpec[] = [],
  groupRowDepth: number = 0,
): GenericNode[] {
  const resourceNodeHash = buildResourceNodeHash(resourceStore, orderSpecs)
  const resNodes: GenericNode[] = []

  for (let resourceId in resourceNodeHash) {
    let resourceNode = resourceNodeHash[resourceId]

    if (!resourceNode.entity.parentId) {
      insertResourceNode(resourceNode, orderSpecs, groupSpecs, groupRowDepth, resNodes)
    }
  }

  return resNodes
}

/*
Builds a hash-by-id that contains ALL resources,
but .children[] array is wired up as well
*/
function buildResourceNodeHash(
  resourceStore: ResourceHash,
  orderSpecs: OrderSpec<ResourceApi>[], // why is this needed if buildResourceHierarchy does order???
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
  groupSpecs: GenericGroupSpec[],
  groupRowDepth: number,
  resNodes: GenericNode[],
) {
  if (groupSpecs.length) {
    let groupNode = ensureGroupNodes(resourceNode, groupSpecs[0], groupRowDepth <= 0, resNodes)

    insertResourceNode(resourceNode, orderSpecs, groupSpecs.slice(1), groupRowDepth - 1, groupNode.children)
  } else {
    insertResourceNodeInSiblings(resourceNode, orderSpecs, resNodes as ResourceNode[])
  }
}

function ensureGroupNodes(
  resourceNode: ResourceNode,
  groupSpec: GenericGroupSpec,
  pooledHeight: boolean,
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
      pooledHeight,
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
