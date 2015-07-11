
class ResourceGrid extends Grid


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
		resourceId = selectionRange.resourceId # TODO: check customized value AS WELL

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


	computeEventDrop: (startCell, endCell, event) ->

		if not endCell.resourceId # why would this ever happen tho?
			return null

		allowResourceChange = true # TODO: setting
		if not allowResourceChange and startCell.resourceId != endCell.resourceId
			return null

		eventRange = super

		if eventRange
			eventRange.resourceId = endCell.resourceId

		eventRange


	computeExternalDrop: (cell, meta) ->

		if not cell.resourceId # why would this ever happen tho?
			return null

		eventRange = super

		if eventRange
			eventRange.resourceId = cell.resourceId

		eventRange


	computeEventResize: (type, startCell, endCell, event) ->
		eventRange = super

		if eventRange
			eventRange.resourceId = startCell.resourceId

		eventRange


	# Selection
	# ---------------------------------------------------------------------------------


	computeSelection: (cell0, cell1) ->
		selectionRange = super

		if selectionRange
			selectionRange.resourceId = cell0.resourceId

		selectionRange
