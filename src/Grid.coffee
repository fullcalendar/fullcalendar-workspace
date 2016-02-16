
origGetSegClasses = Grid::getSegClasses


Grid::getSegClasses = (seg) ->
	classes = origGetSegClasses.apply(this, arguments)
	if seg.resource
		# .concat will process non-arrays and arrays
		classes = classes.concat(seg.resource.eventClassName or [])
	classes


Grid::getSegSkinCss = (seg) ->
	view = @view
	event = seg.event
	source = event.source or {}
	eventColor = event.color
	sourceColor = source.color
	optionColor = view.opt('eventColor')
	resource = seg.resource

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
