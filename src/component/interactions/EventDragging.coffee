
# references to pre-monkeypatched methods
EventDragging_computeEventDropMutation = EventDragging::computeEventDropMutation


EventDragging::computeEventDropMutation = (startFootprint, endFootprint, eventDef) ->

	if startFootprint.resourceId and endFootprint.resourceId and
			startFootprint.resourceId != endFootprint.resourceId and
			@component.isEventDefResourceEditable(eventDef)

		mutation = new ResourceEventDefMutation()
		mutation.oldResourceId = startFootprint.resourceId
		mutation.newResourceId = endFootprint.resourceId

		mutation.setDateMutation(
			@computeEventDateMutation(startFootprint, endFootprint)
		)

		mutation
	else
		EventDragging_computeEventDropMutation.apply(this, arguments)
