
ResourceGridMixin = # expects a Grid


	# whether we should attempt to render selections or resizes that span
	# across different resources
	allowCrossResource: true


	eventRangeToSpans: (eventRange, event) ->
		resourceIds = @view.calendar.getEventResourceIds(event)
		if resourceIds.length

			# returns an array of copies, with disctinct resourceId's
			for resourceId in resourceIds
				$.extend({}, eventRange, { resourceId })

		else if FC.isBgEvent(event)
			# super-method. returns a single span with no resourceId
			Grid::eventRangeToSpans.apply(this, arguments)
		else
			[] # non-bg events must have resourceIds, so return empty


	# DnD
	# ---------------------------------------------------------------------------------


	fabricateHelperEvent: (eventLocation, seg) ->
		event = Grid::fabricateHelperEvent.apply(this, arguments) # super-method
		@view.calendar.setEventResourceId(event, eventLocation.resourceId)

		resourceIds = eventLocation.resourceIds
		if resourceIds and resourceIds.length > 1
			event.resourceIds = resourceIds

		event


	# TODO: if resource-only dragging or date-only dragging,
	# optimize the Grid's hit coordinate computations.
	computeEventDrop: (startSpan, endSpan, event) ->

		if @view.isEventStartEditable(event)
			dropLocation = Grid::computeEventDrop.apply(this, arguments) # super-method
		else
			dropLocation = FC.pluckEventDateProps(event) # keep event dates the same

		if dropLocation
			if @view.isEventResourceEditable(event)
				resourceIds = event.resourceIds
				if resourceIds and resourceIds.length > 1
					if endSpan.resourceId != startSpan.resourceId
						resourceIds = resourceIds.filter (resourceId) ->
							`resourceId != startSpan.resourceId`

						resourceIds.push endSpan.resourceId

					resourceIds = $.unique resourceIds
					dropLocation.resourceIds = resourceIds
				else
					dropLocation.resourceId = endSpan.resourceId
			else
				dropLocation.resourceId = startSpan.resourceId # the original

		dropLocation


	computeExternalDrop: (span, meta) ->
		dropLocation = Grid::computeExternalDrop.apply(this, arguments)
		if dropLocation
			dropLocation.resourceId = span.resourceId # super-method
		dropLocation


	computeEventResize: (type, startSpan, endSpan, event) ->

		if not @allowCrossResource and startSpan.resourceId != endSpan.resourceId
			return

		resizeLocation = Grid::computeEventResize.apply(this, arguments) # super-method

		resourceIds = event.resourceIds
		if resourceIds and resourceIds.length > 1
			resizeLocation.resourceIds = resourceIds
		else
			resizeLocation.resourceId = startSpan.resourceId

		resizeLocation


	# Selection
	# ---------------------------------------------------------------------------------


	computeSelectionSpan: (startSpan, endSpan) ->

		if not @allowCrossResource and startSpan.resourceId != endSpan.resourceId
			return

		selectionSpan = Grid::computeSelectionSpan.apply(this, arguments) # super-method
		if selectionSpan
			selectionSpan.resourceId = startSpan.resourceId
		selectionSpan
