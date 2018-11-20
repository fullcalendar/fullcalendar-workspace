import { ResourceHash, Resource } from "../structs/resource"
import { flexibleCompare, compareByFieldSpecs, assignTo } from "fullcalendar"

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
  spec: any
}

export interface GroupNode {
  id: string // 'field:value'
  group: Group
}

export interface ResourceNode {
  id: string // 'resourceId' (won't collide with group ID's because has colon)
  rowSpans: number[]
  depth: number
  hasChildren: boolean
  resource: Resource
  resourceFields: any
}

/*
doesn't accept grouping
*/
export function flattenResources(resourceStore: ResourceHash, orderSpecs): Resource[] {
  return buildRowNodes(resourceStore, [], orderSpecs, false)
    .map(function(node) {
      return node.resource
    })
}

export function buildRowNodes(resourceStore: ResourceHash, groupSpecs, orderSpecs, isVGrouping: boolean) {
  let complexNodes = buildHierarchy(resourceStore, isVGrouping ? -1 : 1, groupSpecs, orderSpecs)
  let flatNodes = []

  flattenNodes(complexNodes, flatNodes, isVGrouping, [], 0)

  return flatNodes
}

function flattenNodes(complexNodes: ParentNode[], res, isVGrouping, rowSpans, depth) {

  for (let i = 0; i < complexNodes.length; i++) {
    let complexNode = complexNodes[i]
    let group = (complexNode as GroupParentNode).group

    if (group) {

      if (isVGrouping) {
        let firstRowIndex = res.length
        let rowSpanIndex = rowSpans.length

        flattenNodes(complexNode.children, res, isVGrouping, rowSpans.concat(0), depth)

        if (firstRowIndex < res.length) {
          let firstRow = res[firstRowIndex]
          let firstRowSpans = firstRow.rowSpans = firstRow.rowSpans.slice()

          firstRowSpans[rowSpanIndex] = res.length - firstRowIndex
        }
      } else {
        res.push({
          id: group.spec.field + ':' + group.value,
          group
        })

        flattenNodes(complexNode.children, res, isVGrouping, rowSpans, depth + 1)
      }

    } else if ((complexNode as ResourceParentNode).resource) {
      res.push({
        id: (complexNode as ResourceParentNode).resource.id,
        rowSpans,
        depth,
        hasChildren: Boolean(complexNode.children.length),
        resource: (complexNode as ResourceParentNode).resource,
        resourceFields: (complexNode as ResourceParentNode).resourceFields,
      })

      flattenNodes(complexNode.children, res, isVGrouping, rowSpans, depth + 1)
    }
  }
}

function buildHierarchy(resourceStore: ResourceHash, maxDepth: number, groupSpecs, orderSpecs): ParentNode[] {
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

function buildResourceNodes(resourceStore: ResourceHash, orderSpecs): ResourceNodeHash {
  let nodeHash: ResourceNodeHash = {}

  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    nodeHash[resourceId] = {
      resource,
      resourceFields: buildResourceFields(resource),
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

function insertResourceNode(resourceNode: ResourceParentNode, nodes: ParentNode[], groupSpecs, depth: number, maxDepth: number, orderSpecs) {
  if (groupSpecs.length && (maxDepth === -1 || depth <= maxDepth)) {
    let groupNode = ensureGroupNodes(resourceNode, nodes, groupSpecs[0])

    insertResourceNode(resourceNode, groupNode.children, groupSpecs.slice(1), depth + 1, maxDepth, orderSpecs)
  } else {
    insertResourceNodeInSiblings(resourceNode, nodes, orderSpecs)
  }
}

function ensureGroupNodes(resourceNode: ResourceParentNode, nodes: ParentNode[], groupSpec): GroupParentNode {
  let groupValue = resourceNode.resourceFields[groupSpec.field]
  let groupNode
  let newGroupIndex

  // find an existing group that matches, or determine the position for a new group
  if (groupSpec.order) {
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i]

      if ((node as GroupParentNode).group) {
        let cmp = flexibleCompare(groupValue, (node as GroupParentNode).group.value) * groupSpec.order

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
    let cmp = compareByFieldSpecs(siblings[i].resourceFields, resourceNode.resourceFields, orderSpecs)

    if (cmp > 0) { // went 1 past. insert at i
      break
    }
  }

  siblings.splice(i, 0, resourceNode)
}

function buildResourceFields(resource: Resource) {
  let obj = assignTo({}, resource.extendedProps, resource)

  delete obj.extendedProps

  return obj
}
