import { EventApi } from 'fullcalendar'
import ResourceApi from './ResourceApi';

declare module 'fullcalendar/EventApi' {

  interface Default {
    resources: ResourceApi[]
  }

}

// computed property
Object.defineProperty(EventApi.prototype, 'resources', {
  get(this: EventApi) {
    let { calendar } = this

    return this.def.resourceIds.map(function(resourceId) {
      return calendar.getResourceById(resourceId)
    })
  },
  // just copy settings that TS compiler usually outputs. TODO: better solution?
  enumerable: true,
  configurable: true
})
