import { Group, Resource, GenericNode, ResourceEntityExpansions, ResourceNode, GroupNode, createGroupId } from '@fullcalendar/resource/internal'

export interface ResourcePrintLayout {
  entity: Resource
  resourceFields: any // !!!
  colGroups: Group[]
  colGroupIndexes: number[]

  isExpanded: boolean
  hasChildren: boolean
  indent: number
}

export interface GroupRowPrintLayout {
  entity: Group

  isExpanded: boolean
  hasChildren: boolean
  indent: number
}

/*
TODO: test multiple levels of group-col nesting
*/
export function buildPrintLayouts(
  hierarchy: GenericNode[],
  hasNesting: boolean,
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): (ResourcePrintLayout | GroupRowPrintLayout)[] {
  const layouts: (ResourcePrintLayout | GroupRowPrintLayout)[] = []

  function processNodes(
    nodes: GenericNode[],
    indent: number,
    rowIndexStart: number,
    colGroups: Group[],
    colGroupIndexes: number[]
  ): number {
    let totalRowCnt = 0

    for (const node of nodes) {
      if ((node as ResourceNode).resourceFields) { // resource
        const isExpanded = expansions[(node as ResourceNode).entity.id] ?? expansionDefault
        const hasChildren = Boolean(node.children.length)

        layouts.push({
          entity: (node as ResourceNode).entity,
          resourceFields: (node as ResourceNode).resourceFields,
          colGroups,
          colGroupIndexes: colGroupIndexes.concat(rowIndexStart + totalRowCnt),
          isExpanded,
          hasChildren,
          indent,
        })

        totalRowCnt += 1
        totalRowCnt += processNodes(node.children, indent + 1, rowIndexStart + totalRowCnt, colGroups, colGroupIndexes)

      } else if ((node as GroupNode).pooledHeight) { // column-group
        totalRowCnt += processNodes(
          node.children,
          indent,
          0,
          colGroups.concat((node as GroupNode).entity),
          colGroupIndexes,
        )

      } else { // row-group (FYI, can't be within a column-group)
        const isExpanded = expansions[createGroupId((node as GroupNode).entity)] ?? expansionDefault
        const hasChildren = Boolean(node.children.length)

        layouts.push({
          entity: (node as GroupNode).entity,
          isExpanded,
          hasChildren,
          indent,
        })

        totalRowCnt += 1
        totalRowCnt += processNodes(node.children, indent + 1, 0, colGroups, colGroupIndexes)
      }
    }

    return totalRowCnt
  }

  processNodes(hierarchy, hasNesting ? 1 : 0, 0, [], [])
  return layouts
}
