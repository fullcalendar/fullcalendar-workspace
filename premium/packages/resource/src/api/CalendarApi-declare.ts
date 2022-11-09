import { ResourceApi } from './ResourceApi.js'
import { ResourceInput } from '../structs/resource.js'
import { ResourceAction } from '../reducers/resource-action.js'

declare module '@fullcalendar/core' {
  interface CalendarApi {
    dispatch(action: ResourceAction)
    addResource(input: ResourceInput, scrollTo?: boolean): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }
}
