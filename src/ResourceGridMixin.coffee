
ResourceGridMixin = # expects a Grid


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
			Grid::eventRangeToEventFootprints.apply(this, arguments)
		else
			[]


	# DnD
	# ---------------------------------------------------------------------------------


	computeEventDropMutation: (startFootprint, endFootprint, legacyEvent) ->

		if @view.isEventStartEditable(legacyEvent)
			mutation = Grid::computeEventDropMutation.apply(this, arguments)
		else
			mutation = new EventDefMutation()

		if @view.isEventResourceEditable(legacyEvent) and startFootprint.resourceId != endFootprint.resourceId
			mutation.oldResourceId = startFootprint.resourceId
			mutation.newResourceId = endFootprint.resourceId

		mutation


	computeExternalDrop: (resourceComponentFootprint, meta) ->
		eventDef = Grid::computeExternalDrop.apply(this, arguments)
		eventDef.addResourceId(resourceComponentFootprint.resourceId)
		eventDef


	# Resize
	# ---------------------------------------------------------------------------------


	computeEventStartResizeMutation: (startFootprint, endFootprint, event) ->

		if not @allowCrossResource and startFootprint.resourceId != endFootprint.resourceId
			return

		Grid::computeEventStartResizeMutation.apply(this, arguments)


	computeEventEndResizeMutation: (startFootprint, endFootprint, event) ->

		if not @allowCrossResource and startFootprint.resourceId != endFootprint.resourceId
			return

		Grid::computeEventEndResizeMutation.apply(this, arguments)


	# Selection
	# ---------------------------------------------------------------------------------


	computeSelectionFootprint: (startFootprint, endFootprint) ->

		if not @allowCrossResource and startFootprint.resourceId != endFootprint.resourceId
			return

		plainFootprint = Grid::computeSelectionFootprint.apply(this, arguments)

		new ResourceComponentFootprint(
			plainFootprint.unzonedRange,
			plainFootprint.isAllDay,
			startFootprint.resourceId
		)
