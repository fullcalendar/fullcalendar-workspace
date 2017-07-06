
origGetSegCustomClasses = Grid::getSegCustomClasses
origGetSegDefaultBackgroundColor = Grid::getSegDefaultBackgroundColor
origGetSegDefaultBorderColor = Grid::getSegDefaultBorderColor
origGetSegDefaultTextColor = Grid::getSegDefaultTextColor


Grid::getSegCustomClasses = (seg) ->
	classes = origGetSegCustomClasses.apply(this, arguments)

	for resource in @getSegResources(seg)
		# .concat will process non-arrays and arrays
		classes = classes.concat(resource.eventClassName or [])

	classes


Grid::getSegDefaultBackgroundColor = (seg) ->
	resources = @getSegResources(seg)

	for currentResource in resources
		while currentResource
			val = currentResource.eventBackgroundColor or currentResource.eventColor
			if val
				return val
			currentResource = currentResource._parent

	origGetSegDefaultBackgroundColor.apply(this, arguments) # super


Grid::getSegDefaultBorderColor = (seg) ->
	resources = @getSegResources(seg)

	for currentResource in resources
		while currentResource
			val = currentResource.eventBorderColor or currentResource.eventColor
			if val
				return val
			currentResource = currentResource._parent

	origGetSegDefaultBorderColor.apply(this, arguments) # super


Grid::getSegDefaultTextColor = (seg) ->
	resources = @getSegResources(seg)

	for currentResource in resources
		while currentResource
			val = currentResource.eventTextColor
			if val
				return val
			currentResource = currentResource._parent

	origGetSegDefaultTextColor.apply(this, arguments) # super


Grid::getSegResources = (seg) ->
	if seg.resource
		# grid has defined an explicit resource that the seg lives in
		[ seg.resource ]
	else
		# seg does not visually live inside a resource,
		# so query all resources associated with the seg's event
		# TODO: move away from legacy!!!
		@view.calendar.getEventResources(seg.footprint.getEventLegacy())
