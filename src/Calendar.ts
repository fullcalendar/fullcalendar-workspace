import { DateClickApi, DateSelectionApi, DateSpan, Calendar } from 'fullcalendar'
import ResourceApi from './api/ResourceApi'

declare module 'fullcalendar/Calendar' {

  interface DateClickApi {
    resource?: ResourceApi
  }

  interface DateSelectionApi {
    resource?: ResourceApi
  }

  interface Default {
    getResourceById(id: string): ResourceApi | null
  }

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

export function transformDateClickApi(dateClick: DateClickApi, dateSpan: DateSpan, calendar: Calendar) {
  if (dateSpan.resourceId) {
    dateClick.resource = calendar.getResourceById(dateSpan.resourceId)
  }
}

export function transformDateSelectionApi(dateClick: DateSelectionApi, dateSpan: DateSpan, calendar: Calendar) {
  if (dateSpan.resourceId) {
    dateClick.resource = calendar.getResourceById(dateSpan.resourceId)
  }
}
