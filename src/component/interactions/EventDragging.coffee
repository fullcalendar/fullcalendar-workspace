
# references to pre-monkeypatched methods
EventDragging_computeEventDropMutation = EventDragging::computeEventDropMutation


###
monkeypatching can cause an event to seem draggable if the resource is editable but the
start/end dates are NOT. make sure to account for this.
###
EventDragging::computeEventDropMutation = (startFootprint, endFootprint, eventDef) ->
	isDatesDraggable = @component.isEventDefStartEditable(eventDef)

	if startFootprint.resourceId and endFootprint.resourceId and
			startFootprint.resourceId != endFootprint.resourceId and
			@component.isEventDefResourceEditable(eventDef)

		mutation = new ResourceEventDefMutation()
		mutation.oldResourceId = startFootprint.resourceId
		mutation.newResourceId = endFootprint.resourceId

		if isDatesDraggable
			mutation.setDateMutation(
				@computeEventDateMutation(startFootprint, endFootprint)
			)

		mutation

	else if isDatesDraggable
		EventDragging_computeEventDropMutation.apply(this, arguments)
