
class ResourceGrid extends Grid # TODO: consider making this a mixin


	# whether we should attempt to render selections or resizes that span
	# across different resources
	allowCrossResource: true


	eventRangeToSpans: (range, event) ->
		resourceIds = @getEventResourceIds(event)
		if resourceIds.length

			# returns an array of copies, with disctinct resourceId's
			for resourceId in resourceIds
				$.extend({}, range, { resourceId })

		else if FC.isBgEvent(event)
			super # returns a single span with no resourceId
		else
			[] # non-bg events must have resourceIds, so return empty


	getEventResourceIds: (event) ->
		# we make event.resourceId take precedence over event.resourceIds
		# because in DnD code, the helper event is programatically assigned a event.resourceId
		# which is more convenient because it overrides event.resourceIds
		resourceId = @view.calendar.getEventResourceId(event)
		if resourceId
			[ resourceId ]
		else
			event.resourceIds or []


	# DnD
	# ---------------------------------------------------------------------------------


	fabricateHelperEvent: (eventLocation, seg) ->
		event = super
		@view.calendar.setEventResourceId(event, eventLocation.resourceId)
		event


	computeEventDrop: (startSpan, endSpan, event) ->

		allowResourceChange = true # TODO: make this a setting
		if not allowResourceChange and startSpan.resourceId != endSpan.resourceId
			return null

		dropLocation = super
		if dropLocation
			dropLocation.resourceId = endSpan.resourceId
		dropLocation


	computeExternalDrop: (span, meta) ->
		dropLocation = super
		if dropLocation
			dropLocation.resourceId = span.resourceId
		dropLocation


	computeEventResize: (type, startSpan, endSpan, event) ->

		if not @allowCrossResource and startSpan.resourceId != endSpan.resourceId
			return

		resizeLocation = super
		if resizeLocation
			resizeLocation.resourceId = startSpan.resourceId
		resizeLocation


	# Selection
	# ---------------------------------------------------------------------------------


	computeSelectionSpan: (startSpan, endSpan) ->

		if not @allowCrossResource and startSpan.resourceId != endSpan.resourceId
			return

		selectionSpan = super
		if selectionSpan
			selectionSpan.resourceId = startSpan.resourceId
		selectionSpan
