import { DateComponent, EventFootprint } from 'fullcalendar'
import ResourceComponentFootprint from '../models/ResourceComponentFootprint'

declare module 'fullcalendar/DateComponent' {
  interface Default {
    isResourceFootprintsEnabled: boolean
    renderResources(resources)
    unrenderResources()
    renderResource(resource)
    unrenderResource(resource)
  }
}

// references to pre-monkeypatched methods
const origMethods = {
  eventRangeToEventFootprints: DateComponent.prototype.eventRangeToEventFootprints
}

// configuration for subclasses
DateComponent.prototype.isResourceFootprintsEnabled = false


DateComponent.prototype.eventRangeToEventFootprints = function(eventRange) {
  if (!this.isResourceFootprintsEnabled) {
    return origMethods.eventRangeToEventFootprints.apply(this, arguments)
  } else {
    const { eventDef } = eventRange
    const resourceIds = eventDef.getResourceIds()

    if (resourceIds.length) {
      return resourceIds.map((resourceId) => (
        new EventFootprint(
          new ResourceComponentFootprint(
            eventRange.unzonedRange,
            eventDef.isAllDay(),
            resourceId
          ),
          eventDef,
          eventRange.eventInstance // might not exist
        )
      ))
    } else if (eventDef.hasBgRendering()) { // TODO: it's strange to be relying on this
      return origMethods.eventRangeToEventFootprints.apply(this, arguments)
    } else {
      return []
    }
  }
}


// Resource Low-level Rendering
// ----------------------------------------------------------------------------------------------
// ResourceViewMixin wires these up


DateComponent.prototype.renderResources = function(resources) {
  this.callChildren('renderResources', arguments)
}


DateComponent.prototype.unrenderResources = function() {
  this.callChildren('unrenderResources', arguments)
}


DateComponent.prototype.renderResource = function(resource) {
  this.callChildren('renderResource', arguments)
}


DateComponent.prototype.unrenderResource = function(resource) {
  this.callChildren('unrenderResource', arguments)
}
