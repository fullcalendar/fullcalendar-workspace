import { ResourceHash, Resource } from "../structs/resource"
import { flexibleCompare, compareByFieldSpecs, assignTo } from "fullcalendar"

export interface HierarchyNode {
  children: HierarchyNode[]
}

export interface ResourceNode extends HierarchyNode {
  resource: Resource
  cmpObj: any
}

type ResourceNodeHash = { [resourceId: string]: ResourceNode }

export interface GroupNode extends HierarchyNode {
  group: {
    value: any
    spec: any
  }
}

export function buildHierarchy(resourceStore: ResourceHash, maxDepth: number, groupSpecs, orderSpecs): HierarchyNode[] {
  let resourceNodes = buildResourceNodes(resourceStore, orderSpecs)
  let builtNodes: HierarchyNode[] = []

  for (let resourceId in resourceNodes) {
    let resourceNode = resourceNodes[resourceId]

    if (!resourceNode.resource.parentId) {
      insertResourceNode(resourceNode, builtNodes, groupSpecs, 0, maxDepth, orderSpecs)
    }
  }

  return builtNodes
}

function buildResourceNodes(resourceStore: ResourceHash, orderSpecs): ResourceNodeHash {
  let nodeHash: ResourceNodeHash = {}

  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    nodeHash[resourceId] = {
      resource,
      cmpObj: buildResourceCmpObj(resource),
      children: []
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

function insertResourceNode(resourceNode: ResourceNode, nodes: HierarchyNode[], groupSpecs, depth: number, maxDepth: number, orderSpecs) {
  if (groupSpecs.length && (maxDepth === -1 || depth <= maxDepth)) {
    let groupNode = ensureGroupNodes(resourceNode, nodes, groupSpecs[0])

    insertResourceNode(resourceNode, groupNode.children, groupSpecs.slice(1), depth + 1, maxDepth, orderSpecs)
  } else {
    insertResourceNodeInSiblings(resourceNode, nodes, orderSpecs)
  }
}

function ensureGroupNodes(resourceNode: ResourceNode, nodes: HierarchyNode[], groupSpec): GroupNode {
  let groupValue = resourceNode.cmpObj[groupSpec.field]
  let groupNode
  let newGroupIndex

  // find an existing group that matches, or determine the position for a new group
  if (groupSpec.order) {
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i]

      if ((node as GroupNode).group) {
        let cmp = flexibleCompare(groupValue, (node as GroupNode).group.value) * groupSpec.order

        if (cmp === 0) {
          groupNode = node
          break
        } else if (cmp > 0) {
          newGroupIndex = i
          break
        }
      }
    }
  } else { // the groups are unordered
    for (newGroupIndex = 0; newGroupIndex < nodes.length; newGroupIndex++) {
      let node = nodes[newGroupIndex]

      if ((node as GroupNode).group && groupValue === (node as GroupNode).group.value) {
        groupNode = node
        break
      }
    }
  }

  if (!groupNode) {
    groupNode = {
      group: {
        value: groupValue,
        spec: groupSpec
      },
      children: []
    }

    nodes.splice(newGroupIndex, 0, groupNode)
  }

  return groupNode
}

function insertResourceNodeInSiblings(resourceNode, siblings, orderSpecs) {
  let i

  for (i = 0; i < siblings.length; i++) {
    let cmp = compareByFieldSpecs(siblings[i].cmpObj, resourceNode.cmpObj, orderSpecs)

    if (cmp > 0) { // went 1 past. insert at i
      break
    }
  }

  siblings.splice(i, 0, resourceNode)
}

function buildResourceCmpObj(resource) {
  return assignTo({}, resource.extendedProps, resource, {
    id: resource.publicId
  })
}
