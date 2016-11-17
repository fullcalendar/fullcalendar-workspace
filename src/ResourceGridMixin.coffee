
ResourceGridMixin = # expects a Grid


	# whether we should attempt to render selections or resizes that span
	# across different resources
	allowCrossResource: true


	eventRangeToSpans: (range, event) ->
		resourceIds = @view.calendar.getEventResourceIds(event)
		if resourceIds.length

			# returns an array of copies, with disctinct resourceId's
			for resourceId in resourceIds
				$.extend({}, range, { resourceId })

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
		`
		// @fix jga
		var resourceIds = eventLocation.resourceIds;
		if (resourceIds && resourceIds.length > 1) {
			event.resourceIds = resourceIds;
		}
		// @endfix jga
		`
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
				# # fix #111
				`
				var resourceIds = event.resourceIds;
				if (resourceIds && resourceIds.length > 1) {
					if (endSpan.resourceId != startSpan.resourceId) {
						resourceIds = resourceIds.filter(function(resourceId) {
							return resourceId != startSpan.resourceId;
						});

						resourceIds.push(endSpan.resourceId);
					}

					dropLocation.resourceIds = resourceIds;
				} else {
					dropLocation.resourceId = endSpan.resourceId;
				}
				`
				# dropLocation.resourceId = endSpan.resourceId
				# endfix #111
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
		if resizeLocation
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
