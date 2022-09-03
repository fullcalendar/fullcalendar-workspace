import { ResourceApi } from './ResourceApi'
import { ResourceInput } from '../structs/resource'
import { ResourceAction } from '../reducers/resource-action'

declare module '@fullcalendar/common' {
  interface CalendarApi {
    dispatch(action: ResourceAction)
    addResource(input: ResourceInput, scrollTo?: boolean): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }
}
