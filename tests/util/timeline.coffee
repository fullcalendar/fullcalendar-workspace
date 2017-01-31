
dragResourceTimelineEvent = (eventEl, dropInfo) ->
	new Promise (resolve) ->
		modifiedEvent = null

		currentCalendar.on 'eventDragStop', ->
			setTimeout -> # wait for eventDrop to be called
				resolve(modifiedEvent)

		currentCalendar.on 'eventDrop', (event) ->
			modifiedEvent = event

		eventEl.simulate 'drag',
			localPoint: { left: 0, top: '50%' },
			end: getResourceTimelinePoint(dropInfo.resourceId, dropInfo.date)


selectResourceTimeline = (startInfo, inclusiveEndInfo) ->
	new Promise (resolve) ->
		selectInfo = null

		currentCalendar.on 'select', (start, end) ->
			selectInfo = { start, end }

		$('.fc-body .fc-time-area').simulate 'drag',
			point: getResourceTimelinePoint(startInfo.resourceId, startInfo.date)
			end: getResourceTimelinePoint(inclusiveEndInfo.resourceId, inclusiveEndInfo.date)
			onRelease: ->
				setTimeout -> # wait for select to fire
					resolve(selectInfo)


getResourceTimelineRect = (resourceId, start, end) ->
	if typeof resourceId == 'object'
		obj = resourceId
		resourceId = obj.resourceId
		start = obj.start
		end = obj.end
	start = $.fullCalendar.moment.parseZone(start)
	end = $.fullCalendar.moment.parseZone(end)
	coord0 = getTimelineLeft(start)
	coord1 = getTimelineLeft(end)
	rowRect = getBoundingRect(getTimelineRowEl(resourceId))
	{
		left: Math.min(coord0, coord1)
		right: Math.max(coord0, coord1)
		top: rowRect.top
		bottom: rowRect.bottom
	}


getResourceTimelinePoint = (resourceId, date) ->
	rowRect = getBoundingRect(getTimelineRowEl(resourceId))
	{
		left: getTimelineLeft(date)
		top: (rowRect.top + rowRect.bottom) / 2
	}


getTimelineRect = (start, end) ->
	if typeof start == 'object'
		obj = start
		start = obj.start
		end = obj.end
	start = $.fullCalendar.moment.parseZone(start)
	end = $.fullCalendar.moment.parseZone(end)
	coord0 = getTimelineLeft(start)
	coord1 = getTimelineLeft(end)
	canvasRect = getBoundingRect($('.fc-body .fc-time-area .fc-scroller-canvas'))
	{
		left: Math.min(coord0, coord1)
		right: Math.max(coord0, coord1)
		top: canvasRect.top
		bottom: canvasRect.bottom
	}


getTimelinePoint = (date) ->
	contentRect = getBoundingRect($('.fc-body .fc-time-area .fc-content'))
	{
		left: getTimelineLeft(date)
		top: (contentRect.top + contentRect.bottom) / 2
	}


getTimelineLine = (date) ->
	contentRect = getBoundingRect($('.fc-body .fc-time-area .fc-content'))
	left = getTimelineLeft(date)
	{
		left: left
		right: left
		top: contentRect.top
		bottom: contentRect.bottom
	}

###
targetDate can be in between slat dates
###
getTimelineLeft = (targetDate) ->
	targetDate = $.fullCalendar.moment.parseZone(targetDate)
	isRtl = $('.fc').hasClass('fc-rtl')
	borderWidth = 1
	slatEls = getTimelineSlatEl(targetDate)

	getLeadingEdge = (cellEl) ->
		if isRtl
			cellEl.offset().left + cellEl.outerWidth() - borderWidth
		else
			cellEl.offset().left + borderWidth

	getTrailingEdge = (cellEl) ->
		if isRtl
			cellEl.offset().left - borderWidth
		else
			cellEl.offset().left + borderWidth + cellEl.outerWidth()

	if slatEls.length == 1
		return getLeadingEdge(slatEls)

	slatEls = $('.fc-body .fc-slats td') # all slats
	slatDate = null
	prevSlatDate = null

	for slatEl, i in slatEls # traverse earlier to later
		slatEl = $(slatEl)

		prevSlatDate = slatDate
		slatDate = $.fullCalendar.moment.parseZone(slatEl.data('date'))

		# is target time between start of previous slat but before this one?
		if targetDate < slatDate
			# before first slat
			if not prevSlatDate
				return getLeadingEdge(slatEl)
			else
				prevSlatEl = slatEls.eq(i - 1)
				prevSlatCoord = getLeadingEdge(prevSlatEl)
				slatCoord = getLeadingEdge(slatEl)
				return prevSlatCoord +
					(slatCoord - prevSlatCoord) *
					((targetDate - prevSlatDate) / (slatDate - prevSlatDate))

	# target date must be after start date of last slat
	# `slatDate` is set to the start date of the last slat

	# guess the duration of the last slot, based on previous duration
	slatMsDuration = slatDate - prevSlatDate

	slatCoord = getLeadingEdge(slatEl)
	slatEndCoord = getTrailingEdge(slatEl)

	slatCoord + # last slat's starting edge
		(slatEndCoord - slatCoord) *
		Math.min(1, (targetDate - slatDate) / slatMsDuration) # don't go past the last slat


getTimelineRowEl = (resourceId) ->
	$('.fc-body .fc-resource-area tr[data-resource-id="' + resourceId + '"]')


getTimelineSlatEl = (date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-body .fc-slats td[data-date="' + date.format() + '"]')


getTimelineResourceIds = ->
	$('.fc-body .fc-resource-area tr[data-resource-id]').map (i, tr) ->
		$(tr).data('resource-id')
	.get() # jquery -> array


getTimelineResourceTitles = ->
	$('.fc-body .fc-resource-area tr[data-resource-id] .fc-cell-text').map (i, td) ->
		$(td).text()
	.get() # jquery -> array
