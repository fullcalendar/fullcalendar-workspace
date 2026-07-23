import { Group, GenericNode, ResourceNode, GroupNode, createGroupId } from '../resource/common/resource-hierarchy'
import { Resource } from '../resource/structs/resource'
import { ResourceEntityExpansions } from '../resource/reducers/resourceEntityExpansions'

/*
TODO: rename `pooledHeight` to just isVerticalGroup or something
*/

export interface GenericLayout<Entity> {
  rowIndex: number // visible or not
  visibleIndex: number // just for rows
  entity: Entity
  pooledHeight?: boolean // default: false
  children: GenericLayout<Entity>[]
}

export interface ResourceRowLayout { // specific GenericLayout
  rowIndex: number // is 0-based
  visibleIndex: number // just for rows
  entity: Resource
  pooledHeight?: boolean // should NOT be defined!
  resourceFields: any
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  depth: number // TODO: converge with indent
  rowDepth: number
  children: ResourceRowLayout[] // only *visible* children
}

export interface GroupRowLayout { // specific GenericLayout
  rowIndex: number // is 0-based
  visibleIndex: number // just for rows
  entity: Group
  pooledHeight: false
  isExpanded: boolean
  hasChildren: boolean // if has *any* children
  indent: number
  depth: number // TODO: converge with indent
  rowDepth: number
  children: (ResourceRowLayout | GroupRowLayout | GroupCellLayout)[]
}

export interface GroupCellLayout { // specific GenericLayout
  rowIndex: number // is 0-based
  visibleIndex: number // just for rows
  rowSpan: number
  entity: Group
  pooledHeight: true
  children: (ResourceRowLayout | GroupCellLayout)[]
}

export type RowLayout = ResourceRowLayout | GroupRowLayout

/*
A "layout" wraps the resource/group entity with presentation information (indent, isExpanded, etc)
Creates a layout hierarchy (`layouts`) and flattened projections for each row type and all rows.
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
  flatRowLayouts: RowLayout[], // displayed after expansion filtering, in visual order
  flatResourceRowLayouts: ResourceRowLayout[], // displayed after expansion filtering
  flatGroupRowLayouts: GroupRowLayout[], // displayed after expansion filtering
  flatGroupColLayouts: GroupCellLayout[][], // displayed after expansion filtering
  totalCnt: number, // entire hierarchy, including collapsed descendants
} {
  const flatResourceRowLayouts: ResourceRowLayout[] = []
  const flatGroupRowLayouts: GroupRowLayout[] = []
  const flatGroupColLayouts: GroupCellLayout[][] = []
  const flatRowLayouts: RowLayout[] = []

  function processNodes(
    nodes: GenericNode[],
    startingIndex: number,
    startingVisibleIndex: number,
    depth: number,
    rowDepth: number,
    indent: number,
    isVisible: boolean,
  ): [
    processNodes: GenericLayout<Resource | Group>[],
    totalCnt: number, // deep. visible or not
    visibleCnt: number,
  ] {
    const layouts: GenericLayout<Resource | Group>[] = []
    let totalCnt = 0 // visible or not
    let visibleCnt = 0

    // TODO: more DRY within
    for (const node of nodes) {

      // ResourceRow
      if ((node as ResourceNode).resourceFields) {
        const isExpanded = expansions[(node as ResourceNode).entity.id] ?? expansionDefault
        const rowIndex = startingIndex + totalCnt++
        const visibleIndex = startingVisibleIndex + visibleCnt++
        const resourceLayout: ResourceRowLayout = {
          rowIndex,
          visibleIndex,
          entity: (node as ResourceNode).entity,
          resourceFields: (node as ResourceNode).resourceFields,
          isExpanded,
          hasChildren: Boolean(node.children.length),
          depth,
          rowDepth,
          indent,
          children: [],
        }
        if (isVisible) {
          flatRowLayouts.push(resourceLayout)
          flatResourceRowLayouts.push(resourceLayout)
          layouts.push(resourceLayout)
        }
        const [localChildren, subtreeTotalCnt, subtreeVisibleCnt] = processNodes(
          node.children,
          startingIndex + totalCnt,
          startingVisibleIndex + visibleCnt,
          depth + 1,
          rowDepth + 1,
          indent + 1,
          isVisible && isExpanded,
        )
        if (isVisible && isExpanded) {
          resourceLayout.children = localChildren as ResourceRowLayout[]
          visibleCnt += subtreeVisibleCnt
        }
        totalCnt += subtreeTotalCnt

      // GroupCell
      } else if ((node as GroupNode).pooledHeight) {
        const rowIndex = startingIndex + totalCnt // DON'T advance
        const visibleIndex = startingVisibleIndex + visibleCnt // DON'T advance
        const groupCellLayout: GroupCellLayout = {
          rowIndex,
          visibleIndex,
          rowSpan: 0, // populated very soon...
          entity: (node as GroupNode).entity,
          pooledHeight: true,
          children: [], // populates very soon...
        }
        if (isVisible) {
          ;(flatGroupColLayouts[depth] || (flatGroupColLayouts[depth] = []))
            .push(groupCellLayout)
          layouts.push(groupCellLayout)
        }
        const [localChildren, subtreeTotalCnt, subtreeVisibleCnt] = processNodes(
          node.children,
          startingIndex + totalCnt,
          startingVisibleIndex + visibleCnt,
          depth + 1,
          rowDepth, // do NOT advance
          indent,
          isVisible,
        )
        if (isVisible) {
          groupCellLayout.children = localChildren as (ResourceRowLayout | GroupCellLayout)[]
          groupCellLayout.rowSpan = subtreeTotalCnt
          visibleCnt += subtreeVisibleCnt
        }
        totalCnt += subtreeTotalCnt

      // GroupRow
      } else {
        const isExpanded = expansions[createGroupId((node as GroupRowLayout).entity)] ?? expansionDefault
        const rowIndex = startingIndex + totalCnt++
        const visibleIndex = startingVisibleIndex + visibleCnt++
        const groupRowLayout: GroupRowLayout = {
          rowIndex,
          visibleIndex,
          entity: (node as GroupNode).entity,
          pooledHeight: false,
          isExpanded,
          hasChildren: Boolean(node.children.length),
          depth,
          rowDepth,
          indent,
          children: [], // populates very soon...
        }
        if (isVisible) {
          flatRowLayouts.push(groupRowLayout)
          flatGroupRowLayouts.push(groupRowLayout)
          layouts.push(groupRowLayout)
        }
        const [localChildren, subtreeTotalCnt, subtreeVisibleCnt] = processNodes(
          node.children,
          startingIndex + totalCnt,
          startingVisibleIndex + visibleCnt,
          depth + 1,
          rowDepth + 1,
          indent + 1,
          isVisible && isExpanded,
        )
        if (isVisible && isExpanded) {
          groupRowLayout.children = localChildren as (ResourceRowLayout | GroupRowLayout | GroupCellLayout)[]
          visibleCnt += subtreeVisibleCnt
        }
        totalCnt += subtreeTotalCnt
      }
    }

    return [layouts, totalCnt, visibleCnt]
  }

  const [layouts, totalCnt] = processNodes(hierarchy, 0, 0, 0, 0, hasNesting ? 1 : 0, true)

  return {
    layouts,
    flatRowLayouts,
    flatResourceRowLayouts,
    flatGroupRowLayouts,
    flatGroupColLayouts,
    totalCnt,
  }
}
