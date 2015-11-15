
class ResourceGrid extends Grid # TODO: consider making this a mixin


	# whether we should attempt to render selections or resizes that span
	# across different resources
	allowCrossResource: true


	eventsToRanges: (events) ->
		eventRanges = super

		for eventRange in eventRanges
			eventRange.resourceId = @view.calendar.getEventResourceId(eventRange.event)

		eventRanges


	eventRangeToSegs: (eventRange) ->
		segs = super
		resourceId = eventRange.resourceId

		if resourceId
			for seg in segs
				seg.resourceId = resourceId

		segs


	selectionRangeToSegs: (selectionRange) ->
		segs = super
		resourceId = selectionRange.resourceId
			# TODO: in the case of eventResourceField,
			#  would be nice to check customized value as well.

		if resourceId
			for seg in segs
				seg.resourceId = resourceId

		segs


	# DnD
	# ---------------------------------------------------------------------------------


	fabricateHelperEvent: (eventRange, seg) ->
		event = super
		@view.calendar.resourceManager.setEventResourceId(event, eventRange.resourceId)
		event


	computeEventDrop: (startSpan, endSpan, event) ->

		if not endSpan.resourceId # TODO: understand why this happens
			return null

		allowResourceChange = true # TODO: make this a setting
		if not allowResourceChange and startSpan.resourceId != endSpan.resourceId
			return null

		eventRange = super

		if eventRange
			eventRange.resourceId = endSpan.resourceId

		eventRange


	computeExternalDrop: (span, meta) ->

		if not span.resourceId # TODO: understand why this happens
			return null

		eventRange = super

		if eventRange
			eventRange.resourceId = span.resourceId

		eventRange


	computeEventResize: (type, startSpan, endSpan, event) ->

		if not @allowCrossResource and startSpan.resourceId != endSpan.resourceId
			return

		eventRange = super

		if eventRange
			eventRange.resourceId = startSpan.resourceId

		eventRange


	# Selection
	# ---------------------------------------------------------------------------------


	computeSelection: (startSpan, endSpan) ->

		if not @allowCrossResource and startSpan.resourceId != endSpan.resourceId
			return

		selectionRange = super

		if selectionRange
			selectionRange.resourceId = startSpan.resourceId

		selectionRange
