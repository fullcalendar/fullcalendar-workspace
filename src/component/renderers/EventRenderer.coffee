
EventRenderer_getFallbackStylingObjs = EventRenderer::getFallbackStylingObjs


EventRenderer::designatedResourceObj = null


EventRenderer::beforeFgSegHtml = (seg) -> # hack
	if seg.footprint.componentFootprint.resourceId
		resourceManager = @view.calendar.resourceManager
		resource = resourceManager.getResourceById(seg.footprint.componentFootprint.resourceId)
		if resource
			@designatedResourceObj = resource


EventRenderer::getFallbackStylingObjs = (eventDef) ->
	objs = EventRenderer_getFallbackStylingObjs.apply(this, arguments)

	if @designatedResourceObj
		objs.unshift(@designatedResourceObj)
	else
		objs = @getEventDefResourceObjs(eventDef).concat(objs)

	objs


EventRenderer::getEventDefResourceObjs = (eventDef) ->
	resourceManager = @view.calendar.resourceManager
	resources = []

	for resourceId in eventDef.getResourceIds()
		resource = resourceManager.getResourceById(resourceId)
		if resource
			resources.push(resource)

	resources
