
# references to pre-monkeypatched methods
EventRenderer_getFallbackStylingObjs = EventRenderer::getFallbackStylingObjs


EventRenderer::designatedResource = null # optionally set by caller. forces @currentResource
EventRenderer::currentResource = null # when set, will affect future rendered segs


EventRenderer::beforeFgSegHtml = (seg) -> # hack
	segResourceId = seg.footprint.componentFootprint.resourceId

	if @designatedResource
		@currentResource = @designatedResource
	else if segResourceId
		@currentResource = @queryResourceObject(segResourceId)
	else
		@currentResource = null


EventRenderer::getFallbackStylingObjs = (eventDef) ->
	objs = EventRenderer_getFallbackStylingObjs.apply(this, arguments)

	if @currentResource
		objs.unshift(@currentResource)

	else if @resourceRepo
		resources = []

		for id in eventDef.getResourceIds()
			resource = @queryResourceObject(id)
			if resource
				resources.push(resource)

		objs = resources.concat(objs)

	objs


EventRenderer::queryResourceObject = (id) ->
	@view.calendar.resourceManager.getResourceById(id)
