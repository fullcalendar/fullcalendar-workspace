import * as $ from 'jquery'
import { EventDef, removeExact } from 'fullcalendar'
import Resource from './Resource'

declare module 'fullcalendar/EventDef' {
  interface Default {
    resourceIds: any
    resourceEditable: boolean
    hasResourceId(resourceId)
    removeResourceId(resourceId)
    addResourceId(resourceId)
    getResourceIds()
  }
}

const origMethods = {
  applyMiscProps: EventDef.prototype.applyMiscProps,
  clone: EventDef.prototype.clone,
  toLegacy: EventDef.prototype.toLegacy
}

EventDef.defineStandardProps({
  resourceEditable: true // automatically transfer
})

/*
new class members
*/
EventDef.prototype.resourceIds = null
EventDef.prototype.resourceEditable = null // `null` is unspecified state


/*
NOTE: we can use defineStandardProps/applyManualStandardProps (example below)
once we do away with the deprecated eventResourceField.
*/
EventDef.prototype.applyMiscProps = function(rawProps) {
  rawProps = $.extend({}, rawProps) // clone, because of delete

  this.resourceIds = Resource.extractIds(rawProps, this.source.calendar)

  delete rawProps.resourceId
  delete rawProps.resourceIds

  origMethods.applyMiscProps.apply(this, arguments)
}


/*
EventDef.defineStandardProps({
  resourceId: false # manually handle
  resourceIds: false # manually handle
});
EventDef.prototype.applyManualStandardProps = function(rawProps) {
  origApplyManualStandardProps.apply(this, arguments);
  this.resourceIds = Resource.extractIds(rawProps, this.source.calendar);
};
*/


/*
resourceId should already be normalized
*/
EventDef.prototype.hasResourceId = function(resourceId) {
  return $.inArray(resourceId, this.resourceIds) !== -1
}

/*
resourceId should already be normalized
*/
EventDef.prototype.removeResourceId = function(resourceId) {
  removeExact(this.resourceIds, resourceId)
}

/*
resourceId should already be normalized
*/
EventDef.prototype.addResourceId = function(resourceId) {
  if (!this.hasResourceId(resourceId)) {
    this.resourceIds.push(resourceId)
  }
}


EventDef.prototype.getResourceIds = function() {
  if (this.resourceIds) {
    return this.resourceIds.slice() // clone
  } else {
    return []
  }
}


EventDef.prototype.clone = function() {
  const def = origMethods.clone.apply(this, arguments)
  def.resourceIds = this.getResourceIds()
  return def
}


EventDef.prototype.toLegacy = function() {
  const obj = origMethods.toLegacy.apply(this, arguments)
  const resourceIds = this.getResourceIds()

  obj.resourceId =
    resourceIds.length === 1 ?
      resourceIds[0] :
      null

  obj.resourceIds =
    resourceIds.length > 1 ?
      resourceIds :
      null

  if (this.resourceEditable != null) { // allows an unspecified state
    obj.resourceEditable = this.resourceEditable
  }

  return obj
}
