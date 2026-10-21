import { DateSpan, CalendarContext } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from './api/ResourceApi'

/*
Adds the resource to the public form of a date point or date span, as dateClick, select, and the
drag/resize callbacks see it
*/
export function transformDateSpan(dateSpan: DateSpan, context: CalendarContext): { resource?: ResourceApi } {
  return dateSpan.resourceId ?
    { resource: context.calendarApi.getResourceById(dateSpan.resourceId) } :
    {}
}
