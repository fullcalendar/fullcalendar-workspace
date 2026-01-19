import { ResourceAction } from './resource-action'

export type ResourceEntityExpansions = { [id: string]: boolean }

export function reduceResourceEntityExpansions(
  expansions: ResourceEntityExpansions | null,
  action: ResourceAction | null,
): ResourceEntityExpansions {
  if (!expansions || !action) {
    return {}
  }

  switch (action.type) {
    case 'SET_RESOURCE_ENTITY_EXPANDED':
      return {
        ...expansions,
        [action.id]: action.isExpanded,
      }

    default:
      return expansions
  }
}
