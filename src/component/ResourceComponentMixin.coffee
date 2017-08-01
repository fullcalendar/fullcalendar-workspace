
ResourceComponentMixin = # expects a InteractiveDateComponent

	eventRendererClass: ResourceEventRenderer
	dateSelectingClass: ResourceDateSelecting
	eventDraggingClass: ResourceEventDragging
	eventResizingClass: ResourceEventResizing
	externalDroppingClass: ResourceExternalDropping


	# whether we should attempt to render selections or resizes that span
	# across different resources
	allowCrossResource: true


	###
	TODO: somehow more DRY with Calendar::eventRangeToEventFootprints
	(However, this DOES have slightly different logic, for rendering).
	###
	eventRangeToEventFootprints: (eventRange) ->
		eventDef = eventRange.eventDef
		resourceIds = eventDef.getResourceIds()

		if resourceIds.length
			for resourceId in resourceIds # returns the accumulation
				new EventFootprint(
					new ResourceComponentFootprint(
						eventRange.unzonedRange
						eventDef.isAllDay()
						resourceId
					)
					eventDef
					eventRange.eventInstance # might not exist
				)
		else if eventDef.hasBgRendering() # TODO: it's strange to be relying on this
			InteractiveDateComponent::eventRangeToEventFootprints.apply(this, arguments)
		else
			[]
