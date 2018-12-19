import { EventApi } from 'fullcalendar'
import ResourceApi from './ResourceApi';

declare module 'fullcalendar/EventApi' {

  interface Default {
    getResources: () => ResourceApi[]
  }

}

EventApi.prototype.getResources = function(this: EventApi): ResourceApi[] {
  let { calendar } = this

  return this.def.resourceIds.map(function(resourceId) {
    return calendar.getResourceById(resourceId)
  })
}
