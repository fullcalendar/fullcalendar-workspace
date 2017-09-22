
# references to pre-monkeypatched methods
DateComponent_eventRangeToEventFootprints = DateComponent::eventRangeToEventFootprints

# configuration for subclasses
DateComponent::isResourceFootprintsEnabled = false


DateComponent::eventRangeToEventFootprints = (eventRange) ->
	if not @isResourceFootprintsEnabled
		DateComponent_eventRangeToEventFootprints.apply(this, arguments)
	else
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
			DateComponent_eventRangeToEventFootprints.apply(this, arguments)
		else
			[]


# Resource Low-level Rendering
# ----------------------------------------------------------------------------------------------
# ResourceViewMixin wires these up


DateComponent::renderResources = (resources) ->
	@callChildren('renderResources', arguments)


DateComponent::unrenderResources = ->
	@callChildren('unrenderResources', arguments)


DateComponent::renderResource = (resource) ->
	@callChildren('renderResource', arguments)


DateComponent::unrenderResource = (resource) ->
	@callChildren('unrenderResource', arguments)
