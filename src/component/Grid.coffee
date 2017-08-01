
orig_getEventFootprintClasses = Grid::getEventFootprintClasses
orig_getEventFootprintDefaultBackgroundColor = Grid::getEventFootprintDefaultBackgroundColor
orig_getEventFootprintDefaultBorderColor = Grid::getEventFootprintDefaultBorderColor
orig_getEventFootprintDefaultTextColor = Grid::getEventFootprintDefaultTextColor


Grid::getEventFootprintClasses = (eventFootprint) ->
	classes = orig_getEventFootprintClasses.apply(this, arguments)

	for resource in @getEventFootprintResources(eventFootprint)
		# .concat will process non-arrays and arrays
		classes = classes.concat(resource.eventClassName or [])

	classes


Grid::getEventFootprintDefaultBackgroundColor = (eventFootprint) ->
	resources = @getEventFootprintResources(eventFootprint)

	for currentResource in resources
		while currentResource
			val = currentResource.eventBackgroundColor or currentResource.eventColor
			if val
				return val
			currentResource = currentResource._parent

	orig_getEventFootprintDefaultBackgroundColor.apply(this, arguments) # super


Grid::getEventFootprintDefaultBorderColor = (eventFootprint) ->
	resources = @getEventFootprintResources(eventFootprint)

	for currentResource in resources
		while currentResource
			val = currentResource.eventBorderColor or currentResource.eventColor
			if val
				return val
			currentResource = currentResource._parent

	orig_getEventFootprintDefaultBorderColor.apply(this, arguments) # super


Grid::getEventFootprintDefaultTextColor = (eventFootprint) ->
	resources = @getEventFootprintResources(eventFootprint)

	for currentResource in resources
		while currentResource
			val = currentResource.eventTextColor
			if val
				return val
			currentResource = currentResource._parent

	orig_getEventFootprintDefaultTextColor.apply(this, arguments) # super


###
TODO: Grid.coffee should deal with componentFootprint
 and ResourceGrid.coffee should deal with (resource)ComponentFootprint
###
Grid::getEventFootprintResources = (eventFootprint) ->
	resourceId = eventFootprint.componentFootprint.resourceId
	resourceIds = []
	resources = []

	if resourceId?
		resourceIds.push(resourceId)
	else
		resourceIds = eventFootprint.eventDef.getResourceIds()

	for resourceId in resourceIds
		resource = @view.calendar.getResourceById(resourceId)
		if resource
			resources.push(resource)

	resources
