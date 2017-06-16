
ResourceGridMixin = # expects a Grid


	# whether we should attempt to render selections or resizes that span
	# across different resources
	allowCrossResource: true


	eventRangeToEventFootprints: (eventRange) ->
		resourceIds = eventRange.eventDef.getResourceIds()

		for resourceId in resourceIds # returns the accumulation
			new EventFootprint(
				new ResourceComponentFootprint(
					eventRange.unzonedRange
					eventRange.eventDef.isAllDay()
					resourceId
				)
				eventRange.eventDef
				eventRange.eventInstance # might not exist
			)


	# DnD
	# ---------------------------------------------------------------------------------


	computeEventDropMutation: (startFootprint, endFootprint) ->
		mutation = Grid::computeEventDropMutation.apply(this, arguments)

		if startFootprint.resourceId != endFootprint.resourceId
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
