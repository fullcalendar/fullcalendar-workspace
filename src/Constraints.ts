import * as $ from 'jquery'
import { Constraints, EventFootprint } from 'fullcalendar'
import Resource from './models/Resource'
import ResourceComponentFootprint from './models/ResourceComponentFootprint'

const origMethods = {
  getPeerEventInstances: Constraints.prototype.getPeerEventInstances,
  isFootprintAllowed: Constraints.prototype.isFootprintAllowed,
  buildCurrentBusinessFootprints: Constraints.prototype.buildCurrentBusinessFootprints,
  footprintContainsFootprint: Constraints.prototype.footprintContainsFootprint,
  footprintsIntersect: Constraints.prototype.footprintsIntersect,
  eventRangeToEventFootprints: Constraints.prototype.eventRangeToEventFootprints,
  parseFootprints: Constraints.prototype.parseFootprints
}


Constraints.prototype.getPeerEventInstances = function(subjectEventDef) {
  const subjectResourceIds = subjectEventDef.getResourceIds()
  const peerInstances = origMethods.getPeerEventInstances.apply(this, arguments)

  if (!subjectResourceIds.length) {
    return peerInstances
  } else {
    return peerInstances.filter(function(peerInstance) {

      // always consider non-resource events to be peers
      if (!peerInstance.def.resourceIds.length) {
        return true
      }

      // has same resource? consider it a peer
      for (let resourceId of subjectResourceIds) {
        if (peerInstance.def.hasResourceId(resourceId)) {
          return true
        }
      }

      return false
    })
  }
}


// enforce resource ID constraint
Constraints.prototype.isFootprintAllowed = function(footprint, peerEventFootprints, constraintVal, overlapVal, subjectEventInstance) {
  if (typeof constraintVal === 'object') {

    const constrainToResourceIds = Resource.extractIds(constraintVal, this)

    if (constrainToResourceIds.length && (
      !(footprint instanceof ResourceComponentFootprint) ||
      $.inArray(footprint.resourceId, constrainToResourceIds) === -1
    )) {
      return false
    }
  }

  return origMethods.isFootprintAllowed.apply(this, arguments)
}


Constraints.prototype.buildCurrentBusinessFootprints = function(isAllDay) {
  const flatResources = this._calendar.resourceManager.getFlatResources()
  let anyCustomBusinessHours = false

  // any per-resource business hours? or will one global businessHours suffice?
  for (let resource of flatResources) {
    if (resource.businessHourGenerator) {
      anyCustomBusinessHours = true
    }
  }

  // if there are any custom business hours, all business hours must be sliced per-resources
  if (anyCustomBusinessHours) {
    const { view } = this._calendar
    const generalBusinessHourGenerator = view.get('businessHourGenerator')
    const unzonedRange = view.dateProfile.activeUnzonedRange
    const componentFootprints = []

    for (let resource of flatResources) {
      const businessHourGenerator = resource.businessHourGenerator || generalBusinessHourGenerator
      const eventInstanceGroup = businessHourGenerator.buildEventInstanceGroup(isAllDay, unzonedRange)

      if (eventInstanceGroup) {
        for (let eventRange of eventInstanceGroup.getAllEventRanges()) {
          componentFootprints.push(
            new ResourceComponentFootprint(
              eventRange.unzonedRange,
              isAllDay, // isAllDay
              resource.id
            )
          )
        }
      }
    }

    return componentFootprints
  } else {
    return origMethods.buildCurrentBusinessFootprints.apply(this, arguments)
  }
}


Constraints.prototype.footprintContainsFootprint = function(outerFootprint, innerFootprint) {
  if (
    outerFootprint instanceof ResourceComponentFootprint &&
    (
      !(innerFootprint instanceof ResourceComponentFootprint) ||
      (innerFootprint.resourceId !== outerFootprint.resourceId)
    )
  ) {
    return false
  }

  return origMethods.footprintContainsFootprint.apply(this, arguments)
}


Constraints.prototype.footprintsIntersect = function(footprint0, footprint1) {
  if (
    footprint0 instanceof ResourceComponentFootprint &&
    footprint1 instanceof ResourceComponentFootprint &&
    (footprint0.resourceId !== footprint1.resourceId)
  ) {
    return false
  }

  return origMethods.footprintsIntersect.apply(this, arguments)
}


/*
TODO: somehow more DRY with DateComponent::eventRangeToEventFootprints monkeypatch
*/
Constraints.prototype.eventRangeToEventFootprints = function(eventRange) {
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
  } else {
    return origMethods.eventRangeToEventFootprints.apply(this, arguments)
  }
}


Constraints.prototype.parseFootprints = function(input) {
  const plainFootprints = origMethods.parseFootprints.apply(this, arguments)
  let resourceIds = input.resourceIds || []

  if (input.resourceId) {
    resourceIds = [ input.resourceId ].concat(resourceIds)
  }

  if (resourceIds.length) {
    const footprints = []

    for (let resourceId of resourceIds) {
      for (let plainFootprint of plainFootprints) {
        footprints.push(
          new ResourceComponentFootprint(
            plainFootprint.unzonedRange,
            plainFootprint.isAllDay,
            resourceId
          )
        )
      }
    }

    return footprints
  } else {
    return plainFootprints
  }
}
