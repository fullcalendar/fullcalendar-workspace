import { flexibleCompare, compareByFieldSpecs, OrderSpec } from '@fullcalendar/common'
import { ResourceHash, Resource } from '../structs/resource'
import { ResourceEntityExpansions } from '../reducers/resourceEntityExpansions'
import { GroupSpec } from './resource-spec'
import { ResourceApi } from '../api/ResourceApi'

interface ParentNode {
  children: ParentNode[]
}

interface ResourceParentNode extends ParentNode {
  resource: Resource
  resourceFields: any
}

type ResourceNodeHash = { [resourceId: string]: ResourceParentNode }

interface GroupParentNode extends ParentNode {
  group: Group
}

export interface Group {
  value: any
  spec: GroupSpec
}

export interface GroupNode {
  id: string // 'field:value'
  isExpanded: boolean
  group: Group
}

export interface ResourceNode {
  id: string // 'resourceId' (won't collide with group ID's because has colon)
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
  resourceFields: any
}

/*
doesn't accept grouping
*/
export function flattenResources(resourceStore: ResourceHash, orderSpecs: OrderSpec<ResourceApi>[]): Resource[] {
  return buildRowNodes(resourceStore, [], orderSpecs, false, {}, true)
    .map((node) => (node as ResourceNode).resource)
}

export function buildRowNodes(
  resourceStore: ResourceHash,
  groupSpecs: GroupSpec[],
  orderSpecs: OrderSpec<ResourceApi>[],
  isVGrouping: boolean,
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): (GroupNode | ResourceNode)[] {
  let complexNodes = buildHierarchy(resourceStore, isVGrouping ? -1 : 1, groupSpecs, orderSpecs)
  let flatNodes = []

  flattenNodes(complexNodes, flatNodes, isVGrouping, [], 0, expansions, expansionDefault)

  return flatNodes
}

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
  maxDepth: number,
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

export function buildResourceFields(resource: Resource) {
  let obj = { ...resource.extendedProps, ...resource.ui, ...resource }

  delete obj.ui
  delete obj.extendedProps

  return obj
}

export function isGroupsEqual(group0: Group, group1: Group) {
  return group0.spec === group1.spec && group0.value === group1.value
}
