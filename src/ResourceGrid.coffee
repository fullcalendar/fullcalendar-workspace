
class ResourceGrid extends Grid # TODO: consider making this a mixin


	# whether we should attempt to render selections or resizes that span
	# across different resources
	allowCrossResource: true


	transformEventSpan: (span, event) ->
		span.resourceId = @view.calendar.getEventResourceId(event)


	# DnD
	# ---------------------------------------------------------------------------------


	fabricateHelperEvent: (eventLocation, seg) ->
		event = super
		@view.calendar.resourceManager.setEventResourceId(event, eventLocation.resourceId)
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
