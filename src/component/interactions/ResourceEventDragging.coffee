
class ResourceEventDragging extends EventDragging


	computeEventDropMutation: (startFootprint, endFootprint, eventDef) ->

		if @component.isEventDefStartEditable(eventDef)
			mutation = super
		else
			mutation = new EventDefMutation()

		if @component.isEventDefResourceEditable(eventDef) and startFootprint.resourceId != endFootprint.resourceId
			mutation.oldResourceId = startFootprint.resourceId
			mutation.newResourceId = endFootprint.resourceId

		mutation
