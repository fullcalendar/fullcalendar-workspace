import { DateSpan, Calendar } from 'fullcalendar'
import ResourceApi from './api/ResourceApi'
import { ResourceInput, parseResource, ResourceHash } from './structs/resource'

declare module 'fullcalendar/Calendar' {

  interface DatePointApi {
    resource?: ResourceApi
  }

  interface DateSpanApi {
    resource?: ResourceApi
  }

  interface Default { // the Calendar
    addResource(input: ResourceInput): ResourceApi
    getResourceById(id: string): ResourceApi | null
  }

}

Calendar.prototype.addResource = function(this: Calendar, input: ResourceInput, scrollTo = true) {
  let resourceHash: ResourceHash = {}
  let resource = parseResource(input, '', resourceHash, this)

  // HACK
  if (scrollTo) {
    this.component.view.addScroll({ forcedRowId: resource.id })
  }

  this.dispatch({
    type: 'ADD_RESOURCE',
    resourceHash
  })

  return new ResourceApi(this, resource)
}

Calendar.prototype.getResourceById = function(this: Calendar, id: string) {
  id = String(id)

  if (this.state.resourceStore) { // guard against calendar with no resource functionality
    let rawResource = this.state.resourceStore[id]

    if (rawResource) {
      return new ResourceApi(this, rawResource)
    }
  }

  return null
}

export function transformDatePoint(dateSpan: DateSpan, calendar: Calendar) {
  return dateSpan.resourceId ?
    { resource: calendar.getResourceById(dateSpan.resourceId) } :
    {}
}

export function transformDateSpan(dateSpan: DateSpan, calendar: Calendar) {
  return dateSpan.resourceId ?
    { resource: calendar.getResourceById(dateSpan.resourceId) } :
    {}
}
