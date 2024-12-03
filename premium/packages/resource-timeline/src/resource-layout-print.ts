import { Group, Resource, GenericNode, ResourceEntityExpansions, ResourceNode, GroupNode, createGroupId } from '@fullcalendar/resource/internal'

export interface ResourcePrintLayout {
  entity: Resource
  resourceFields: any // !!!
  colGroups: Group[]

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

  function processNodes(nodes: GenericNode[], indent: number, colGroups: Group[]): number {
    let totalRowCnt = 0

    for (const node of nodes) {
      if ((node as ResourceNode).resourceFields) { // resource
        const isExpanded = expansions[(node as ResourceNode).entity.id] ?? expansionDefault
        const hasChildren = Boolean(node.children.length)

        layouts.push({
          entity: (node as ResourceNode).entity,
          resourceFields: (node as ResourceNode).resourceFields,
          colGroups,
          isExpanded,
          hasChildren,
          indent,
        })

        totalRowCnt += 1
        totalRowCnt += processNodes(node.children, indent + 1, colGroups)

      } else if ((node as GroupNode).pooledHeight) { // column-group
        totalRowCnt += processNodes(
          node.children,
          indent,
          colGroups.concat((node as GroupNode).entity),
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
        totalRowCnt += processNodes(node.children, indent + 1, colGroups)
      }
    }

    return totalRowCnt
  }

  processNodes(hierarchy, hasNesting ? 1 : 0, [])
  return layouts
}
