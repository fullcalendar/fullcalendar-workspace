import { Resource, Group, ParentNode, ResourceEntityExpansions } from '@fullcalendar/resource/internal'

export interface ColWidthConfig {
  pixels?: number
  frac?: number
}

export interface GroupCellDisplay {
  group: Group
}

export interface GroupRowDisplay {
  group: Group
  isExpanded: boolean
}

export interface ResourceRowDisplay {
  resource: Resource
  resourceFields: any // fields mushed together for sorting
  indent: number
  hasChildren: boolean
  isExpanded: boolean
}

export function buildResourceDisplays(
  hierarchy: ParentNode<Resource | Group>[],
  groupRowDepth: number, // will cause the groupRowDisplays to populate first
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): {
  groupColDisplays: GroupCellDisplay[][]
  rowDisplays: (GroupRowDisplay | ResourceRowDisplay)[]
  heightHierarchy: ParentNode<Resource | Group>[]
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
