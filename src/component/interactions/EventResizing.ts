import { EventResizing } from 'fullcalendar'

// references to pre-monkeypatched methods
const origMethods = {
  computeEventStartResizeMutation: EventResizing.prototype.computeEventStartResizeMutation,
  computeEventEndResizeMutation: EventResizing.prototype.computeEventEndResizeMutation
}


EventResizing.prototype.computeEventStartResizeMutation = function(startFootprint, endFootprint, origEventFootprint) {
  if (
    startFootprint.resourceId && endFootprint.resourceId &&
    (startFootprint.resourceId !== endFootprint.resourceId) &&
    !this.component.allowCrossResource
  ) {
    return null // explicity disallow resizing across two different resources
  } else {
    return origMethods.computeEventStartResizeMutation.apply(this, arguments)
  }
}


EventResizing.prototype.computeEventEndResizeMutation = function(startFootprint, endFootprint, origEventFootprint) {
  if (
    startFootprint.resourceId && endFootprint.resourceId &&
    (startFootprint.resourceId !== endFootprint.resourceId) &&
    !this.component.allowCrossResource
  ) {
    return null // explicity disallow resizing across two different resources
  } else {
    return origMethods.computeEventEndResizeMutation.apply(this, arguments)
  }
}
