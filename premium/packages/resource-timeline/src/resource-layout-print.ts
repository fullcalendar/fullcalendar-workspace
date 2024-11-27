import { Group, Resource, GenericNode, ResourceEntityExpansions } from '@fullcalendar/resource/internal'

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

export function buildPrintLayouts(
  hierarchy: GenericNode[],
  hasNesting: boolean,
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): (ResourcePrintLayout | GroupRowPrintLayout)[] {
  return null as any
}
