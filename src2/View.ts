import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'

declare module 'fullcalendar/View' {
  export interface ViewProps {
    resourceStore: ResourceHash
    resourceEntityExpansions: ResourceEntityExpansions
  }
}
