
# references to pre-monkeypatched methods
EventRenderer_getFallbackStylingObjs = EventRenderer::getFallbackStylingObjs


EventRenderer::resourceRepo = null # set by caller. mandatory if no designatedResource
EventRenderer::designatedResource = null # optionally set by caller. forces @currentResource
EventRenderer::currentResource = null # when set, will affect future rendered segs


EventRenderer::beforeFgSegHtml = (seg) -> # hack
	segResourceId = seg.footprint.componentFootprint.resourceId

	if @designatedResource
		@currentResource = @designatedResource
	else if segResourceId
		@currentResource = @resourceRepo.getById(segResourceId)
	else
		@currentResource = null


EventRenderer::getFallbackStylingObjs = (eventDef) ->
	objs = EventRenderer_getFallbackStylingObjs.apply(this, arguments)

	if @currentResource
		objs.unshift(@currentResource)

	else if @resourceRepo
		resources = []

		for resourceId in eventDef.getResourceIds()
			resources.push(@resourceRepo.getById(resourceId)...)

		objs = resources.concat(objs)

	objs
