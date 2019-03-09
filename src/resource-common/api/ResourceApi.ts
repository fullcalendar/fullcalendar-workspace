import { Calendar, EventApi } from '@fullcalendar/core'
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

  getParent(): ResourceApi | null {
    let calendar = this._calendar
    let parentId = this._resource.parentId

    if (parentId) {
      return new ResourceApi(
        calendar,
        calendar.state.resourceSource[parentId]
      )
    } else {
      return null
    }
  }

  getChildren(): ResourceApi[] {
    let thisResourceId = this._resource.id
    let calendar = this._calendar
    let { resourceStore } = calendar.state
    let childApis: ResourceApi[] = []

    for (let resourceId in resourceStore) {
      if (resourceStore[resourceId].parentId === thisResourceId) {
        childApis.push(
          new ResourceApi(calendar, resourceStore[resourceId])
        )
      }
    }

    return childApis
  }

  /*
  this is really inefficient!
  TODO: make EventApi::resourceIds a hash or keep an index in the Calendar's state
  */
  getEvents(): EventApi[] {
    let thisResourceId = this._resource.id
    let calendar = this._calendar
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

  get id(): string { return this._resource.id }
  get title(): string { return this._resource.title }
  get eventConstraint(): any { return this._resource.ui.constraints[0] || null }
  get eventOverlap(): any { return this._resource.ui.overlap }
  get eventAllow(): any { return this._resource.ui.allows[0] || null }
  get eventBackgroundColor(): string { return this._resource.ui.backgroundColor }
  get eventBorderColor(): string { return this._resource.ui.borderColor }
  get eventTextColor(): string { return this._resource.ui.textColor }

  // NOTE: user can't modify these because Object.freeze was called in event-def parsing
  get eventClassNames(): string[] { return this._resource.ui.classNames }
  get extendedProps(): any { return this._resource.extendedProps }

}
