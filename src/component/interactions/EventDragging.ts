import { EventDragging, EventDefMutation } from 'fullcalendar'

// references to pre-monkeypatched methods
const origMethods = {
  computeEventDropMutation: EventDragging.prototype.computeEventDropMutation
}


/*
monkeypatching can cause an event to seem draggable if the resource is editable but the
start/end dates are NOT. make sure to account for this.
*/
EventDragging.prototype.computeEventDropMutation = function(startFootprint, endFootprint, eventDef) {
  const isDatesDraggable = this.component.isEventDefStartEditable(eventDef)

  if (
    startFootprint.resourceId && endFootprint.resourceId &&
    (startFootprint.resourceId !== endFootprint.resourceId) &&
    this.component.isEventDefResourceEditable(eventDef)
  ) {
    const mutation = new EventDefMutation()
    mutation.oldResourceId = startFootprint.resourceId
    mutation.newResourceId = endFootprint.resourceId

    if (isDatesDraggable) {
      mutation.setDateMutation(
        this.computeEventDateMutation(startFootprint, endFootprint)
      )
    }

    return mutation

  } else if (isDatesDraggable) {
    return origMethods.computeEventDropMutation.apply(this, arguments)
  }
}
