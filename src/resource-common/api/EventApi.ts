import { EventApi } from '@fullcalendar/core'
import ResourceApi from './ResourceApi'

declare module '@fullcalendar/core' {
  interface EventApi {
    getResources: () => ResourceApi[]
  }
}

EventApi.prototype.getResources = function(this: EventApi): ResourceApi[] {
  let calendar = this._calendar

  return this._def.resourceIds.map(function(resourceId) {
    return calendar.getResourceById(resourceId)
  })
}
