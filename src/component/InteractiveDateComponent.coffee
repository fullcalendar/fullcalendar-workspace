
# references to pre-monkeypatched methods
InteractiveDateComponent_isEventDefDraggable = InteractiveDateComponent::isEventDefDraggable


# configuration for subclasses
# whether we should attempt to render selections or resizes that span across different resources
InteractiveDateComponent::allowCrossResource = true


# if an event's dates are not draggable, but it's resource IS, still allow dragging
InteractiveDateComponent::isEventDefDraggable = (eventDef) ->
	@isEventDefResourceEditable(eventDef) or
		InteractiveDateComponent_isEventDefDraggable.call(this, eventDef)


InteractiveDateComponent::isEventDefResourceEditable = (eventDef) ->
	eventDef.resourceEditable ?
		(eventDef.source || {}).resourceEditable ? # TODO: make part of model
		@opt('eventResourceEditable') ?
		@isEventDefGenerallyEditable(eventDef)
