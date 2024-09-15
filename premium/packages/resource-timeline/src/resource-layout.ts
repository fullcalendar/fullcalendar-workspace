import { Group, GenericNode, Resource, ResourceEntityExpansions, ResourceNode, GroupNode, createGroupId } from '@fullcalendar/resource/internal'

export interface GenericLayout<Entity> {
  entity: Entity
  isOwnRow?: boolean // default: false
  children: GenericLayout<Entity>[]
}

export interface ResourceLayout { // specific GenericLayout
  entity: Resource
  isOwnRow?: boolean // default: false
  resourceFields: any
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  children: ResourceLayout[] // only *visible* children
}

export interface GroupRowLayout { // specific GenericLayout
  entity: Group
  isOwnRow: true // default: false
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  children: (ResourceLayout | GroupRowLayout | GroupCellLayout)[]
}

export interface GroupCellLayout { // specific GenericLayout
  entity: Group
  isOwnRow?: false
  children: (ResourceLayout | GroupCellLayout)[]
}

export function buildResourceLayouts(
  hierarchy: GenericNode[],
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): {
  layouts: GenericLayout<Resource | Group>[],
  flatResourceLayouts: ResourceLayout[],
  flatGroupRowLayouts: GroupRowLayout[],
  flatGroupColLayouts: GroupCellLayout[][],
} {
  const flatResourceLayouts: ResourceLayout[] = []
  const flatGroupRowLayouts: GroupRowLayout[] = []
  const flatGroupColLayouts: GroupCellLayout[][] = []

  function processNodes(nodes: GenericNode[], depth: number): GenericLayout<Resource | Group>[] {
    const layouts: GenericLayout<Resource | Group>[] = []
    const initialIndent = hasNesting(nodes) ? 1 : 0

    // TODO: more DRY within
    for (const node of nodes) {
      if ((node as ResourceNode).resourceFields) {
        const isExpanded = expansions[(node as ResourceNode).entity.id]
        const resourceLayout: ResourceLayout = {
          entity: (node as ResourceNode).entity,
          resourceFields: (node as ResourceNode).resourceFields,
          isExpanded: isExpanded != null ? isExpanded : expansionDefault,
          hasChildren: Boolean(node.children.length),
          indent: initialIndent + depth,
          children: processNodes(node.children, depth + 1) as ResourceLayout[],
        }
        flatResourceLayouts.push(resourceLayout)
        layouts.push(resourceLayout)
      } else if ((node as GroupNode).isOwnRow) {
        const isExpanded = expansions[createGroupId((node as GroupRowLayout).entity)]
        const groupRowLayout: GroupRowLayout = {
          entity: (node as GroupNode).entity,
          isOwnRow: true,
          isExpanded: isExpanded != null ? isExpanded : expansionDefault,
          hasChildren: Boolean(node.children.length),
          indent: initialIndent + depth,
          children: processNodes(node.children, depth + 1) as (ResourceLayout | GroupRowLayout | GroupCellLayout)[]
        }
        flatGroupRowLayouts.push(groupRowLayout)
        layouts.push(groupRowLayout)
      } else {
        const groupCellLayout: GroupCellLayout = {
          entity: (node as GroupNode).entity,
          children: processNodes(node.children, depth + 1) as (ResourceLayout | GroupCellLayout)[],
        }
        ;(flatGroupColLayouts[depth] || (flatGroupColLayouts[depth] = [])) // better way?
          .push(groupCellLayout)
        layouts.push(groupCellLayout)
      }
    }

    return layouts
  }

  return {
    layouts: processNodes(hierarchy, 0),
    flatResourceLayouts,
    flatGroupRowLayouts,
    flatGroupColLayouts,
  }
}

function hasNesting(nodes: GenericNode[]) {
  for (let node of nodes) {
    if ((node as ResourceNode).resourceFields) {
      if ((node as ResourceNode).children.length) {
        return true
      }
    } else { // a GroupNode
      return true
    }
  }

  return false
}

// Header Verticals (both spreadsheet & time-area)
// -------------------------------------------------------------------------------------------------

export function buildHeaderLayouts(
  hasSuperHeader: boolean,
  timelineHeaderCnt: number,
): GenericLayout<boolean | number>[] {
  // only one spreadsheet header. all timeline headers are height-children
  if (!hasSuperHeader) {
    const children: GenericLayout<boolean | number>[] = []

    for (let i = 0; i < timelineHeaderCnt; i++) {
      children.push({ entity: i, children: [] })
    }

    return [{
      entity: false, // isSuperHeader: false
      children,
    }]
  }

  // only one timeline header. all spreadsheet headers are height-children
  if (timelineHeaderCnt === 1) {
    return [{
      entity: 0, // timelineHeaderIndex
      children: [
        // guaranteed to have super header, or else first `if` would have executed
        { entity: true, children: [] }, // isSuperHeader: true
        { entity: false, children: [] }, // isSuperHeader: false
      ],
    }]
  }

  // otherwise, their are >1 spreadsheet header and >1 timeline header,
  // give leftover timeline header heights to the "super" spreadsheet height

  const children: GenericLayout<boolean | number>[] = [] // for super-header
  let i: number

  for (i = 0; i < timelineHeaderCnt - 1; i++) {
    children.push({ entity: i, children: [] })
  }

  return [
    { entity: true, children }, // isSuperHeader: true
    { entity: false, children: [{ entity: i, children: [] }] }
  ]
}
