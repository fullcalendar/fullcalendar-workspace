import { Group, HierarchyNode, Resource, ResourceEntityExpansions } from '@fullcalendar/resource/internal'

export interface GenericLayout<Entity> {
  entity: Entity
  isCol?: boolean // default: false
  children: GenericLayout<Entity>[]
}

export interface ResourceLayout { // specific GenericLayout
  entity: Resource
  resourceFields: any
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  children: ResourceLayout[] // only *visible* children
}

export interface GroupRowLayout { // specific GenericLayout
  entity: Group
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  children: (ResourceLayout | GroupRowLayout | GroupCellLayout)[]
}

export interface GroupCellLayout { // specific GenericLayout
  entity: Group
  isCol: true
  children: (ResourceLayout | GroupCellLayout)[]
}

export function buildResourceLayouts(
  hierarchy: HierarchyNode[],
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): {
  layouts: GenericLayout<Resource | Group>[],
  flatResourceLayouts: ResourceLayout[],
  flatGroupRowLayouts: GroupRowLayout[],
  flatGroupColLayouts: GroupCellLayout[][],
} {
  // if any hasNesting, should return indent+1 for all
  return null as any
}

/*
  function hasNesting(nodes: (GroupNode | ResourceNode)[]) {
    for (let node of nodes) {
      if ((node as GroupNode).group) {
        return true
      }

      if ((node as ResourceNode).resource) {
        if ((node as ResourceNode).hasChildren) {
          return true
        }
      }
    }

    return false
  }
*/

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
