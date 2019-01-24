import { ResourceAction } from './resources'

export type ResourceEntityExpansions = { [id: string]: boolean }

export function reduceResourceEntityExpansions(expansions: ResourceEntityExpansions, action: ResourceAction): ResourceEntityExpansions {
  switch (action.type) {
    case 'INIT':
      return {}
    case 'SET_RESOURCE_ENTITY_EXPANDED':
      return {
        ...expansions,
        [action.id]: action.isExpanded
      }
    default:
      return expansions
  }
}
