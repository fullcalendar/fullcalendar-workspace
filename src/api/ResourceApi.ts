import { Calendar, EventApi } from 'fullcalendar'
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

  /*
  this is really inefficient!
  TODO: make EventApi::resourceIds a hash or keep an index in the Calendar's state
  */
  get events(): EventApi[] {
    let calendar = this._calendar
    let thisResourceId = this._resource.id
    let { defs, instances } = calendar.state.eventStore
    let eventApis: EventApi[] = []

    for (let instanceId in instances) {
      let instance = instances[instanceId]
      let def = defs[instance.defId]

      if (def.resourceIds.indexOf(thisResourceId) !== -1) { // inefficient!!!
        eventApis.push(new EventApi(calendar, def, instance))
      }
    }

    return eventApis
  }

}
