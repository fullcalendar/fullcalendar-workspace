import { Calendar } from 'fullcalendar'
import { Resource } from '../structs/resource'

export default class ResourceApi {

  _calendar: Calendar
  _resource: Resource

  constructor(calendar: Calendar, rawResource: Resource) {
    this._calendar = calendar
    this._resource = rawResource
  }

}
