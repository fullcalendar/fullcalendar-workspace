import * as $ from 'jquery'
import { Calendar, EventObjectInput } from 'fullcalendar'
import Resource from './models/Resource'
import ResourceManager from './models/ResourceManager'
import ResourceComponentFootprint from './models/ResourceComponentFootprint'
import { ResourceInput } from './types/input-types'

declare module 'fullcalendar/Calendar' {
  interface Default {
    resourceManager: any
    getResources(): ResourceInput[]
    addResource(resourceInput: ResourceInput, scroll?: boolean)
    removeResource(idOrResource: string | ResourceInput)
    refetchResources()
    rerenderResources()
    buildSelectFootprint(zonedStartInput, zonedEndInput, resourceId?: string)
    getResourceById(id: string): ResourceInput
    getEventResourceId(event: EventObjectInput): string
    getEventResourceIds(event: EventObjectInput): string[]
    setEventResourceId(event: EventObjectInput, resourceId: string)
    setEventResourceIds(event: EventObjectInput, resourceIds: string[])
    getResourceEvents(idOrResource: string | ResourceInput): EventObjectInput[]
    getEventResource(idOrEvent: string | EventObjectInput): ResourceInput
    getEventResources(idOrEvent: string | EventObjectInput): ResourceInput[]
  }
}

// NOTE: for public methods, always be sure of the return value. for chaining
const origMethods = {
  constructed: Calendar.prototype.constructed,
  buildSelectFootprint: Calendar.prototype.buildSelectFootprint
}


// option defaults
Calendar.defaults.refetchResourcesOnNavigate = false
Calendar.defaults.filterResourcesWithEvents = false


Calendar.prototype.resourceManager = null


Calendar.prototype.constructed = function() { // executed immediately after the constructor
  origMethods.constructed.apply(this, arguments)

  this.resourceManager = new ResourceManager(this)
}


Calendar.prototype.instantiateView = function(viewType) {
  const spec = this.viewSpecManager.getViewSpec(viewType)
  let viewClass = spec['class']

  if (this.opt('resources') && (spec.options.resources !== false)) {
    if (spec.queryResourceClass) {
      viewClass = spec.queryResourceClass(spec) || viewClass // might return falsy
    } else if (spec.resourceClass) {
      viewClass = spec.resourceClass
    }
  }

  return new viewClass(this, spec)
}


// for the API only
// retrieves what is currently in memory. no fetching
Calendar.prototype.getResources = function(): ResourceInput[] {
  return Array.prototype.slice.call( // make a copy
    this.resourceManager.topLevelResources
  )
}


// assumes all resources already loaded
Calendar.prototype.addResource = function(resourceInput: ResourceInput, scroll: boolean = false) {
  this.resourceManager.addResource(resourceInput)
    .then((resource) => {
      if (scroll && this.view.scrollToResource) {
        return this.view.scrollToResource(resource)
      }
    })
}


// assumes all resources already loaded
Calendar.prototype.removeResource = function(idOrResource: string | ResourceInput) {
  return this.resourceManager.removeResource(idOrResource)
}


Calendar.prototype.refetchResources = function() { // for API
  this.resourceManager.clear()
  this.view.flash('initialResources')
}


Calendar.prototype.rerenderResources = function() { // for API
  this.resourceManager.resetCurrentResources()
}


Calendar.prototype.buildSelectFootprint = function(zonedStartInput, zonedEndInput, resourceId?: string) {
  const plainFootprint = origMethods.buildSelectFootprint.apply(this, arguments)

  if (resourceId) {
    return new ResourceComponentFootprint(
      plainFootprint.unzonedRange,
      plainFootprint.isAllDay,
      resourceId
    )
  } else {
    return plainFootprint
  }
}


Calendar.prototype.getResourceById = function(id: string): ResourceInput {
  return this.resourceManager.getResourceById(id)
}


// Resources + Events
// ----------------------------------------------------------------------------------------


// DEPRECATED. for external API backwards compatibility
Calendar.prototype.getEventResourceId = function(event: EventObjectInput): string {
  return this.getEventResourceIds(event)[0]
}


Calendar.prototype.getEventResourceIds = function(event: EventObjectInput): string[] {
  const eventDef = this.eventManager.getEventDefByUid(event._id)

  if (eventDef) {
    return eventDef.getResourceIds()
  } else {
    return []
  }
}


// DEPRECATED
Calendar.prototype.setEventResourceId = function(event: EventObjectInput, resourceId: string) {
  this.setEventResourceIds(
    event,
    resourceId ? [ resourceId ] : []
  )
}


Calendar.prototype.setEventResourceIds = function(event: EventObjectInput, resourceIds: string[]) {
  const eventDef = this.eventManager.getEventDefByUid(event._id)

  if (eventDef) {
    eventDef.resourceIds = resourceIds.map((rawResourceId) => {
      return Resource.normalizeId(rawResourceId)
    })
  }
}


// NOTE: views pair *segments* to resources. that's why there's no code reuse
Calendar.prototype.getResourceEvents = function(idOrResource: string | ResourceInput): EventObjectInput[] {
  const resource =
    typeof idOrResource === 'object' ?
      idOrResource :
      this.getResourceById(idOrResource)

  if (resource) {
    // return the event cache, filtered by events assigned to the resource
    // TODO: move away from using clientId
    return this.clientEvents((event) => {
      return $.inArray(resource.id, this.getEventResourceIds(event)) !== -1
    })
  } else {
    return []
  }
}


// DEPRECATED. for external API backwards compatibility
Calendar.prototype.getEventResource = function(idOrEvent: string | EventObjectInput): ResourceInput {
  return this.getEventResources(idOrEvent)[0]
}


Calendar.prototype.getEventResources = function(idOrEvent: string | EventObjectInput): ResourceInput[] {
  const event =
    typeof idOrEvent === 'object' ?
      idOrEvent :
      this.clientEvents(idOrEvent)[0]

  const resources = []

  if (event) {
    for (let resourceId of this.getEventResourceIds(event)) {
      const resource = this.getResourceById(resourceId)
      if (resource) {
        resources.push(resource)
      }
    }
  }
  return resources
}
