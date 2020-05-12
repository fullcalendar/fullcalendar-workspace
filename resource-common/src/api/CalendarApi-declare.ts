import { ResourceApi } from '../api/ResourceApi'
import { ResourceSourceInput } from '../structs/resource-source-parse'
import { ResourceAction } from '../reducers/resource-action'


declare module '@fullcalendar/common' {
  interface CalendarApi {
    dispatch(action: ResourceAction)
    addResource(input: ResourceSourceInput): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }
}
