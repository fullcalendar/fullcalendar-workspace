import { EventObjectInput } from 'fullcalendar'
import { ResourceInput } from './input-types'

declare global {

  interface JQuery {
    fullCalendar(method: 'getResources'): ResourceInput[]
    fullCalendar(method: 'addResource', resourceInput: ResourceInput, scroll?: boolean): JQuery
    fullCalendar(method: 'removeResource', idOrResource: string | ResourceInput): JQuery
    fullCalendar(method: 'refetchResources'): JQuery
    fullCalendar(method: 'rerenderResources'): JQuery
    fullCalendar(method: 'getResourceById', id: string): ResourceInput
    fullCalendar(method: 'getEventResourceId', event: EventObjectInput): string
    fullCalendar(method: 'getEventResourceIds', event: EventObjectInput): string[]
    fullCalendar(method: 'setEventResourceId', event: EventObjectInput, resourceId: string): JQuery
    fullCalendar(method: 'setEventResourceIds', event: EventObjectInput, resourceIds: string[]): JQuery
    fullCalendar(method: 'getResourceEvents', idOrResource: string | ResourceInput): EventObjectInput[]
    fullCalendar(method: 'getEventResource', idOrEvent: string | EventObjectInput): ResourceInput
    fullCalendar(method: 'getEventResources', idOrEvent: string | EventObjectInput): ResourceInput[]
  }

}
