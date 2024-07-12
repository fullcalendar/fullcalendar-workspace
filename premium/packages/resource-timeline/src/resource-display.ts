import { Resource, Group, ParentNode, ResourceEntityExpansions } from '@fullcalendar/resource/internal'

export interface GroupCellDisplay {
  group: Group
}

export interface GroupRowDisplay {
  group: Group
  depth: number // TODO: assume 0?
  isExpanded: boolean
}

export interface ResourceRowDisplay {
  resource: Resource
  resourceFields: any // fields mushed together for sorting
  depth: number
  isExpanded: boolean
  hasChildren: boolean
}

export function buildResourceDisplays(
  hierarchy: ParentNode<Resource | Group>[],
  groupRowDepth: number, // will cause the groupRowDisplays to populate first
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): {
  groupColDisplays: GroupCellDisplay[][]
  groupRowDisplays: GroupRowDisplay[]
  resourceRowDisplays: ResourceRowDisplay[]
  heightHierarchy: ParentNode<Resource | Group>[]
  anyNesting: boolean
} {
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
