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
  indexes: number[] // is 0-based
  parentGroupIndexes: number[] // is 0-based
  rowIndex: number // is 1-based
  entity: Resource
  pooledHeight?: boolean // should NOT be defined!
  resourceFields: any
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  depth: number // TODO: converge with indent
  children: ResourceLayout[] // only *visible* children
}

export interface GroupRowLayout { // specific GenericLayout
  indexes: number[] // is 0-based
  parentGroupIndexes: number[] // is 0-based
  rowIndex: number // is 1-based
  entity: Group
  pooledHeight: false
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  depth: number // TODO: converge with indent
  children: (ResourceLayout | GroupRowLayout | GroupCellLayout)[]
}

export interface GroupCellLayout { // specific GenericLayout
  indexes: number[] // is 0-based
  parentGroupIndexes: number[] // is 0-based
  rowIndex: number // is 1-based
  rowSpan: number
  entity: Group
  pooledHeight: true
  children: (ResourceLayout | GroupCellLayout)[]
}

/*
A "layout" wraps the resource/group entity with presentation information (indent, isExpanded, etc)
Creates a layout hierarchy (`layouts`) as well as flattened hierarchy.
Filters away not-expanded nodes.

TODO: even when a row is collapsed, consistent global rowIndex
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

  function processNodes(
    nodes: GenericNode[],
    parentIndexes: number[],
    parentGroupIndexes: number[],
    startingIndex: number, // zero-based
    depth: number,
    indent: number,
  ): [
    processNodes: GenericLayout<Resource | Group>[],
    deepNodeCnt: number,
  ] {
    const layouts: GenericLayout<Resource | Group>[] = []
    let localNodeCnt = 0
    let localRowCnt = 0

    // TODO: more DRY within
    for (const node of nodes) {

      // ResourceRow
      if ((node as ResourceNode).resourceFields) {
        const isExpanded = expansions[(node as ResourceNode).entity.id] ?? expansionDefault
        const indexes = parentIndexes.concat(localNodeCnt)
        const rowIndex = startingIndex + localRowCnt++
        const resourceLayout: ResourceLayout = {
          indexes,
          parentGroupIndexes,
          rowIndex,
          entity: (node as ResourceNode).entity,
          resourceFields: (node as ResourceNode).resourceFields,
          isExpanded,
          hasChildren: Boolean(node.children.length),
          depth,
          indent,
          children: [],
        }
        flatResourceLayouts.push(resourceLayout)
        layouts.push(resourceLayout)
        if (isExpanded) {
          const [localChildren, subtreeNodeCnt] = processNodes(
            node.children,
            indexes,
            parentGroupIndexes,
            startingIndex + localRowCnt,
            depth + 1,
            indent + 1,
          )
          resourceLayout.children = localChildren as ResourceLayout[]
          localRowCnt += subtreeNodeCnt
        }

      // GroupCell
      } else if ((node as GroupNode).pooledHeight) {
        const indexes = parentIndexes.concat(localNodeCnt)
        const rowIndex = startingIndex + localRowCnt // DON'T advance
        const groupCellLayout: GroupCellLayout = {
          indexes,
          parentGroupIndexes,
          rowIndex,
          rowSpan: 0, // populated very soon...
          entity: (node as GroupNode).entity,
          pooledHeight: true,
          children: [], // populates very soon...
        }
        ;(flatGroupColLayouts[depth] || (flatGroupColLayouts[depth] = []))
          .push(groupCellLayout)
        layouts.push(groupCellLayout)
        const [localChildren, subtreeNodeCnt] = processNodes(
          node.children,
          indexes,
          parentGroupIndexes.concat(localNodeCnt),
          startingIndex + localRowCnt,
          depth + 1,
          indent,
        )
        groupCellLayout.children = localChildren as (ResourceLayout | GroupCellLayout)[]
        groupCellLayout.rowSpan = subtreeNodeCnt
        localRowCnt += subtreeNodeCnt

      // GroupRow
      } else {
        const isExpanded = expansions[createGroupId((node as GroupRowLayout).entity)] ?? expansionDefault
        const indexes = parentIndexes.concat(localNodeCnt)
        const rowIndex = startingIndex + localRowCnt++
        const groupRowLayout: GroupRowLayout = {
          indexes,
          parentGroupIndexes,
          rowIndex,
          entity: (node as GroupNode).entity,
          pooledHeight: false,
          isExpanded,
          hasChildren: Boolean(node.children.length),
          depth,
          indent,
          children: [], // populates very soon...
        }
        flatGroupRowLayouts.push(groupRowLayout)
        layouts.push(groupRowLayout)
        if (isExpanded) {
          const [localChildren, subtreeNodeCnt] = processNodes(
            node.children,
            indexes,
            parentGroupIndexes.concat(localNodeCnt),
            startingIndex + localRowCnt,
            depth + 1,
            indent + 1,
          )
          groupRowLayout.children = localChildren as (ResourceLayout | GroupRowLayout | GroupCellLayout)[]
          localRowCnt += subtreeNodeCnt
        }
      }

      localNodeCnt++
    }

    return [layouts, localRowCnt]
  }

  return {
    layouts: processNodes(hierarchy, [], [], 1, 0, hasNesting ? 1 : 0)[0],
    flatResourceLayouts,
    flatGroupRowLayouts,
    flatGroupColLayouts,
  }
}

export function generateGroupLabelIds(
  domScope: string,
  parentGroupIndexes: number[],
): string {
  const parts: string[] = []
  const len = parentGroupIndexes.length

  for (let i = 0; i < len; i++) {
    parts.push(domScope + '-' + parentGroupIndexes.slice(0, i + 1).join('-'))
  }

  return parts.join(' ')
}
