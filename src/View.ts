import { View } from 'fullcalendar'
import { processLicenseKey } from './license'

declare module 'fullcalendar/View' {
  interface Default {
    canHandleSpecificResources: boolean
    watchResources()
    unwatchResources()
    getInitialResources(dateProfile)
    bindResourceChanges(eventsPayload)
    unbindResourceChanges()
    setResources(resources, eventsPayload)
    unsetResources()
    resetResources(resources, eventsPayload)
    addResource(resource, allResources, eventsPayload)
    removeResource(resource, allResources, eventsPayload)
    handleResourceAdd(resource)
    handleResourceRemove(resource)
    filterResourcesWithEvents(resources, eventsPayload)
    eventsPayloadToRanges(eventsPayload)
  }
}

// pre-monkeypatch methods
const origMethods = {
  setElement: View.prototype.setElement,
  removeElement: View.prototype.removeElement,
  triggerViewRender: View.prototype.triggerViewRender
}

// new properties
View.prototype.canHandleSpecificResources = false


// View Rendering
// --------------------------------------------------------------------------------------------------


View.prototype.setElement = function() {
  origMethods.setElement.apply(this, arguments)
  this.watchResources() // do after have the el, because might render, which assumes a render skeleton
}


View.prototype.removeElement = function() {
  this.unwatchResources()
  origMethods.removeElement.apply(this, arguments)
}


// Show the warning even for non-resource views
// inject license key before 'viewRender' which is called by super's afterBaseDisplay
View.prototype.triggerViewRender = function() {
  processLicenseKey(
    this.opt('schedulerLicenseKey'),
    this.el // container element
  )
  origMethods.triggerViewRender.apply(this, arguments)
}


// Resource Binding
// --------------------------------------------------------------------------------------------------


View.prototype.watchResources = function() {
  const initialDepNames = []
  const bindingDepNames = [ 'initialResources' ]

  if (this.opt('refetchResourcesOnNavigate')) {
    initialDepNames.push('dateProfile')
  }

  if (this.opt('filterResourcesWithEvents')) {
    bindingDepNames.push('currentEvents')
  }

  this.watch('initialResources', initialDepNames, (deps) => {
    return this.getInitialResources(deps.dateProfile) // promise
  })

  this.watch('bindingResources', bindingDepNames, (deps) => {
    this.bindResourceChanges(deps.currentEvents)
    this.setResources(deps.initialResources, deps.currentEvents)
  }, () => {
    this.unbindResourceChanges()
    this.unsetResources()
  })
}


View.prototype.unwatchResources = function() {
  this.unwatch('initialResources')
  this.unwatch('bindingResources')
}


// dateProfile is optional
View.prototype.getInitialResources = function(dateProfile) {
  const { calendar } = this

  if (dateProfile) {
    return calendar.resourceManager.getResources(
      calendar.msToMoment(dateProfile.activeUnzonedRange.startMs, dateProfile.isRangeAllDay),
      calendar.msToMoment(dateProfile.activeUnzonedRange.endMs, dateProfile.isRangeAllDay)
    )
  } else {
    return calendar.resourceManager.getResources()
  }
}


// eventsPayload is optional
View.prototype.bindResourceChanges = function(eventsPayload) {
  this.listenTo(this.calendar.resourceManager, {
    set: (resources) => {
      this.setResources(resources, eventsPayload)
    },
    unset: () => {
      this.unsetResources()
    },
    reset: (resources) => {
      this.resetResources(resources, eventsPayload)
    },
    add: (resource, allResources) => {
      this.addResource(resource, allResources, eventsPayload)
    },
    remove: (resource, allResources) => {
      this.removeResource(resource, allResources, eventsPayload)
    }
  })
}


View.prototype.unbindResourceChanges = function() {
  this.stopListeningTo(this.calendar.resourceManager)
}



// Event Rendering
// --------------------------------------------------------------------------------------------------


View.watch('displayingEvents', [ 'displayingDates', 'hasEvents', 'currentResources' ], function(deps) {
  this.requestEventsRender(this.get('currentEvents'))
}, function() {
  this.requestEventsUnrender()
})


// Resource Data
// --------------------------------------------------------------------------------------------------


// currentEvents is optional
View.prototype.setResources = function(resources, eventsPayload) {
  if (eventsPayload) {
    resources = this.filterResourcesWithEvents(resources, eventsPayload)
  }

  this.set('currentResources', resources)
  this.set('hasResources', true)
}


View.prototype.unsetResources = function() {
  this.unset('currentResources')
  this.unset('hasResources')
}


// eventsPayload is optional
View.prototype.resetResources = function(resources, eventsPayload) {
  this.startBatchRender()
  this.unsetResources()
  this.setResources(resources, eventsPayload)
  this.stopBatchRender()
}


// eventsPayload is optional
View.prototype.addResource = function(resource, allResources, eventsPayload) {

  if (!this.canHandleSpecificResources) {
    this.resetResources(allResources, eventsPayload)
    return
  }

  if (eventsPayload) {
    const a = this.filterResourcesWithEvents([ resource ], eventsPayload)
    if (!a.length) {
      resource = null
    }
  }

  if (resource) {
    this.set('currentResources', allResources) // TODO: filter against eventsPayload?
    this.handleResourceAdd(resource)
  }
}


View.prototype.removeResource = function(resource, allResources, eventsPayload) {

  if (!this.canHandleSpecificResources) {
    this.resetResources(allResources, eventsPayload)
    return
  }

  this.set('currentResources', allResources) // TODO: filter against eventsPayload?
  this.handleResourceRemove(resource)
}


// Resource Change Handling
// --------------------------------------------------------------------------------------------------


View.prototype.handleResourceAdd = function(resource) {
  // subclasses should implement
}


View.prototype.handleResourceRemove = function(resource) {
  // subclasses should implement
}


// Resource Filtering
// ------------------------------------------------------------------------------------------------------------------


View.prototype.filterResourcesWithEvents = function(resources, eventsPayload) {
  const eventRanges = this.eventsPayloadToRanges(eventsPayload)
  const resourceIdHits = {}

  for (let eventRange of eventRanges) {
    for (let resourceId of eventRange.eventDef.getResourceIds()) {
      resourceIdHits[resourceId] = true
    }
  }

  return _filterResourcesWithEvents(resources, resourceIdHits)
}


View.prototype.eventsPayloadToRanges = function(eventsPayload) {
  const dateProfile = this._getDateProfile()
  const allEventRanges = []

  for (let eventDefId in eventsPayload) {
    const instanceGroup = eventsPayload[eventDefId]
    const eventRanges = instanceGroup.sliceRenderRanges(
      dateProfile.activeUnzonedRange
    )
    allEventRanges.push(...(eventRanges || []))
  }

  return allEventRanges
}


// provides a new structure with masked objects
function _filterResourcesWithEvents(sourceResources, resourceIdHits) {
  const filteredResources = []
  for (let sourceResource of sourceResources) {
    if (sourceResource.children.length) {
      const filteredChildren = _filterResourcesWithEvents(sourceResource.children, resourceIdHits)
      if (filteredChildren.length || resourceIdHits[sourceResource.id]) {
        const filteredResource = Object.create(sourceResource) // mask
        filteredResource.children = filteredChildren
        filteredResources.push(filteredResource)
      }
    } else { // no children, so no need to mask
      if (resourceIdHits[sourceResource.id]) {
        filteredResources.push(sourceResource)
      }
    }
  }
  return filteredResources
}
