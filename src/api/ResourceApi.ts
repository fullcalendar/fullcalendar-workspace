import { Calendar } from 'fullcalendar'
import { Resource } from '../structs/resource'

export default class ResourceApi {

  _calendar: Calendar
  _resource: Resource

  constructor(calendar: Calendar, rawResource: Resource) {
    this._calendar = calendar
    this._resource = rawResource
  }

  setProp(name: string, value: any) {
    this._calendar.dispatch({
      type: 'SET_RESOURCE_PROP',
      resourceId: this._resource.id,
      propName: name,
      propValue: value
    })
  }

  remove() {
    this._calendar.dispatch({
      type: 'REMOVE_RESOURCE',
      resourceId: this._resource.id
    })
  }

  get id(): string {
    return this._resource.id
  }

  get title(): string {
    return this._resource.title
  }

}
