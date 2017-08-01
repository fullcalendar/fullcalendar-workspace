
EventRenderer_getClasses = EventRenderer::getClasses
EventRenderer_getDefaultBgColor = EventRenderer::getDefaultBgColor
EventRenderer_getDefaultBorderColor = EventRenderer::getDefaultBorderColor
EventRenderer_getDefaultTextColor = EventRenderer::getDefaultTextColor


EventRenderer::getClasses = (eventFootprint) ->
	classes = EventRenderer_getSegClasses.apply(this, arguments)
	resources = @getEventFootprintResources(eventFootprint)

	for resource in resources
		# .concat will process non-arrays and arrays
		classes = classes.concat(resource.eventClassName or [])

	classes


EventRenderer::getDefaultBgColor = (eventFootprint) ->
	resources = @getEventFootprintResources(eventFootprint)

	for currentResource in resources
		while currentResource
			val = currentResource.eventBackgroundColor or currentResource.eventColor
			if val
				return val
			currentResource = currentResource._parent

	EventRenderer_getDefaultBgColor.apply(this, arguments)


EventRenderer::getDefaultBorderColor = (eventFootprint) ->
	resources = @getEventFootprintResources(eventFootprint)

	for currentResource in resources
		while currentResource
			val = currentResource.eventBorderColor or currentResource.eventColor
			if val
				return val
			currentResource = currentResource._parent

	EventRenderer_getDefaultBorderColor.apply(this, arguments)


EventRenderer::getDefaultTextColor = (eventFootprint) ->
	resources = @getEventFootprintResources(eventFootprint)

	for currentResource in resources
		while currentResource
			val = currentResource.eventTextColor
			if val
				return val
			currentResource = currentResource._parent

	EventRenderer_getDefaultTextColor.apply(this, arguments)


EventRenderer::getEventFootprintResources = (eventFootprint) ->
	resourceManager = @view.calendar.resourceManager
	resourceIds = @getEventFootprintResourceIds(eventFootprint)
	resources = []

	for resourceId in resourceIds
		resource = resourceManager.getResourceById(resourceId)
		if resource
			resources.push(resource)

	resources

EventRenderer::getEventFootprintResourceIds = (eventFootprint) ->
	eventFootprint.eventDef.getResourceIds()
