import { ResourceHash } from './structs/resource'

declare module 'fullcalendar/View' {
  export interface ViewProps {
    resourceStore: ResourceHash
  }
}
