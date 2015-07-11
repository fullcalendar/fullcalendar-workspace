
Grid::getEventSkinCss = (event) ->
	view = @view
	source = event.source or {}
	eventColor = event.color
	sourceColor = source.color
	optionColor = view.opt('eventColor')

	resource = null
	resourceManager = view.calendar.resourceManager
	resourceId = resourceManager.getEventResourceId(event)
	if resourceId
		resource = resourceManager.getResourceById(resourceId)
	# TODO: streamline into resourceManager.getEventResource?

	getResourceBackgroundColor = ->
		val = null
		currentResource = resource
		while currentResource and not val
			val = currentResource.eventBackgroundColor or currentResource.eventColor
			currentResource = currentResource._parent
		val

	getResourceBorderColor = ->
		val = null
		currentResource = resource
		while currentResource and not val
			val = currentResource.eventBorderColor or currentResource.eventColor
			currentResource = currentResource._parent
		val

	getResourceTextColor = ->
		val = null
		currentResource = resource
		while currentResource and not val
			val = currentResource.eventTextColor
			currentResource = currentResource._parent
		val

	return {
		'background-color':
			event.backgroundColor or
			eventColor or
			getResourceBackgroundColor() or
			source.backgroundColor or
			sourceColor or
			view.opt('eventBackgroundColor') or
			optionColor
		'border-color':
			event.borderColor or
			eventColor or
			getResourceBorderColor() or
			source.borderColor or
			sourceColor or
			view.opt('eventBorderColor') or
			optionColor
		'color':
			event.textColor or
			getResourceTextColor() or
			source.textColor or
			view.opt('eventTextColor')
	}
