
getResourceTimelinePoint = (resourceId, date) ->
	rowRect = getBoundingRect(getTimelineRowEl(resourceId))
	left = getTimelineLeft(date)
	{
		left: left
		top: (rowRect.top + rowRect.bottom) / 2
	}


getTimelinePoint = (date) ->
	contentRect = getBoundingRect($('.fc-body .fc-time-area .fc-content'))
	left = getTimelineLeft(date)
	{
		left: left
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
