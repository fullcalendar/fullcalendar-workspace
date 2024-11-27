import { Group, GenericNode, Resource, ResourceEntityExpansions, ResourceNode, GroupNode, createGroupId } from '@fullcalendar/resource/internal'

/*
TODO: rename `pooledHeight` to just isVerticalGroup or something
*/

export interface GenericLayout<Entity> {
  entity: Entity
  pooledHeight?: boolean // default: false
  children: GenericLayout<Entity>[]
}

export interface ResourceLayout { // specific GenericLayout
  rowIndex: number
  entity: Resource
  pooledHeight?: boolean // should NOT be defined!
  resourceFields: any
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  children: ResourceLayout[] // only *visible* children
}

export interface GroupRowLayout { // specific GenericLayout
  rowIndex: number
  entity: Group
  pooledHeight: false
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  children: (ResourceLayout | GroupRowLayout | GroupCellLayout)[]
}

export interface GroupCellLayout { // specific GenericLayout
  rowIndex: number
  entity: Group
  pooledHeight: true
  children: (ResourceLayout | GroupCellLayout)[]
}

/*
A "layout" wraps the resource/group entity with presentation information (indent, isExpanded, etc)
Creates a layout hierarchy (`layouts`) as well as flattened hierarchy.
Filters away not-expanded nodes.
*/
export function buildResourceLayouts(
  hierarchy: GenericNode[],
  hasNesting: boolean,
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): {
  layouts: GenericLayout<Resource | Group>[], // use for height computations. web of height relationships
  flatResourceLayouts: ResourceLayout[],
  flatGroupRowLayouts: GroupRowLayout[],
  flatGroupColLayouts: GroupCellLayout[][],
} {
  const flatResourceLayouts: ResourceLayout[] = []
  const flatGroupRowLayouts: GroupRowLayout[] = []
  const flatGroupColLayouts: GroupCellLayout[][] = []
  let rowCnt = 0

  function processNodes(nodes: GenericNode[], depth: number, indent: number): GenericLayout<Resource | Group>[] {
    const layouts: GenericLayout<Resource | Group>[] = []

    // TODO: more DRY within
    for (const node of nodes) {
      if ((node as ResourceNode).resourceFields) {
        const isExpanded = expansions[(node as ResourceNode).entity.id] ?? expansionDefault
        const resourceLayout: ResourceLayout = {
          rowIndex: rowCnt++,
          entity: (node as ResourceNode).entity,
          resourceFields: (node as ResourceNode).resourceFields,
          isExpanded,
          hasChildren: Boolean(node.children.length),
          indent,
          children: [],
        }
        flatResourceLayouts.push(resourceLayout)
        layouts.push(resourceLayout)
        if (isExpanded) {
          resourceLayout.children = processNodes(node.children, depth + 1, indent + 1) as ResourceLayout[]
        }
      } else if ((node as GroupNode).pooledHeight) {
        const groupCellLayout: GroupCellLayout = {
          rowIndex: rowCnt, // DON'T advance
          entity: (node as GroupNode).entity,
          pooledHeight: true,
          children: [], // populates very soon...
        }
        ;(flatGroupColLayouts[depth] || (flatGroupColLayouts[depth] = []))
          .push(groupCellLayout)
        layouts.push(groupCellLayout)
        groupCellLayout.children = processNodes(node.children, depth + 1, indent) as (ResourceLayout | GroupCellLayout)[]
      } else {
        const isExpanded = expansions[createGroupId((node as GroupRowLayout).entity)] ?? expansionDefault
        const groupRowLayout: GroupRowLayout = {
          rowIndex: rowCnt++,
          entity: (node as GroupNode).entity,
          pooledHeight: false,
          isExpanded,
          hasChildren: Boolean(node.children.length),
          indent,
          children: [], // populates very soon...
        }
        flatGroupRowLayouts.push(groupRowLayout)
        layouts.push(groupRowLayout)
        if (isExpanded) {
          groupRowLayout.children = processNodes(node.children, depth + 1, indent + 1) as (ResourceLayout | GroupRowLayout | GroupCellLayout)[]
        }
      }
    }

    return layouts
  }

  return {
    layouts: processNodes(hierarchy, 0, hasNesting ? 1 : 0),
    flatResourceLayouts,
    flatGroupRowLayouts,
    flatGroupColLayouts,
  }
}

/*
TODO: rename to be about expanders and indentation hierarchy
*/
export function computeHasNesting(nodes: GenericNode[]) {
  for (let node of nodes) {
    if ((node as ResourceNode).resourceFields) {
      if ((node as ResourceNode).children.length) {
        return true
      }
    } else { // a GroupNode
      return !(node as GroupNode).pooledHeight // NOT column grouping. row groups
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
      pooledHeight: true,
      children,
    }]
  }

  // only one timeline header. all spreadsheet headers are height-children
  if (timelineHeaderCnt === 1) {
    return [{
      entity: 0, // timelineHeaderIndex
      pooledHeight: true,
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
    { entity: true, pooledHeight: true, children }, // isSuperHeader: true
    { entity: false, pooledHeight: true, children: [{ entity: i, children: [] }] }
  ]
}
