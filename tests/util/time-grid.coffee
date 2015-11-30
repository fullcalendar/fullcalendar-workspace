
checkTimeGridDowBodyEl = (dayAbbrev) ->
	els = getTimeGridDowBodyEls(dayAbbrev)
	expect(els.length).toBe(1)
	els


getTimeGridDowBodyEls = (dayAbbrev) ->
	$('.fc-time-grid td.fc-day.fc-' + dayAbbrev)


getTimeGridDateBodyEls = (iso8601) ->
	$('.fc-time-grid .fc-day[data-date="' + iso8601 + '"]')


getTimeGridDateBodyEl = (iso8601) ->
	els = $('.fc-time-grid .fc-day[data-date="' + iso8601 + '"]')
	expect(els.length).toBe(1)
	els


checkTimeSlotEl = (timeText, slotOffset=0) ->
	tr = $('.fc-slats td.fc-axis span:contains(' + timeText + ')')
		.filter (i, node) -> ## TODO: do this for all contains!!!!!
			$.trim($(node).text()) == timeText
		.parent().parent()
	for i in [0...slotOffset] by 1
		tr = tr.next()
	tr


getTimeGridSpecial = (resourceTitle, dayDateString, timeText, slotOffset) ->
	dayRect = getTimeGridResourceDayRect(resourceTitle, dayDateString)
	slotRect = getBoundingRect(checkTimeSlotEl(timeText, slotOffset))
	{
		top: slotRect.top + 1
		left: (dayRect.left + dayRect.right) / 2
	}


getTimeGridResourceDayRect = (resourceTitle, dayDateString) ->
	resourceEls = getResourceHeadEls(resourceTitle)
	resourceRects =
		for node in resourceEls
			getBoundingRect(node)
	dayEls = getTimeGridDateBodyEls(dayDateString)
	goodRects = []
	for node in dayEls
		dayRect = getBoundingRect(node)
		for resourceRect in resourceRects
			hOverlap = Math.min(dayRect.right, resourceRect.right) -
				Math.max(dayRect.left, resourceRect.left)
			if hOverlap > 10
				goodRects.push(dayRect)
	expect(goodRects.length).toBe(1)
	goodRects[0]


getTimeGridDatePoint = (iso8601, dayOffset, timeText, slotOffset) ->
	dayRects = sortBoundingRects(getTimeGridDateBodyEls(iso8601))
	dayRect = dayRects[dayOffset]
	slotRect = getBoundingRect(checkTimeSlotEl(timeText, slotOffset))
	{
		top: slotRect.top + 1
		left: (dayRect.left + dayRect.right) / 2
	}


getTimeGridResourceDatePoint = (resourceText, iso8601, timeText, slotOffset) ->
	dayRect = getTimeGridResourceDayRect(resourceText, iso8601)
	slotRect = getBoundingRect(checkTimeSlotEl(timeText, slotOffset))
	{
		top: slotRect.top + 1
		left: (dayRect.left + dayRect.right) / 2
	}


getTimeGridPoint = (dow, dowIndex, timeText, slotOffset) ->
	dayRects = sortBoundingRects(getTimeGridDowBodyEls(dow))
	dayRect = dayRects[dowIndex]
	slotRect = getBoundingRect(checkTimeSlotEl(timeText, slotOffset))
	{
		top: slotRect.top + 1
		left: (dayRect.left + dayRect.right) / 2
	}
