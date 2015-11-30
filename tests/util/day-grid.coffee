
checkDayGridDowBodyEl = (dayAbbrev) ->
	els = getDayGridDowBodyEls(dayAbbrev)
	expect(els.length).toBe(1)
	els


getDayGridDateBodyEls = (iso8601) ->
	$('.fc-day-grid .fc-day[data-date="' + iso8601 + '"]')


getDayGridDowBodyEls = (dayAbbrev) ->
	$('.fc-day-grid .fc-row:first-child td.fc-day.fc-' + dayAbbrev)


getDayGridDateEl = (iso8601) ->
	el = $('.fc-day-grid .fc-row:first-child td.fc-day[data-date="' + iso8601 + '"]')
	expect(el.length).toBe(1)


getDayGridDateEls = (iso8601) ->
	$('.fc-day-grid .fc-row:first-child td.fc-day[data-date="' + iso8601 + '"]')


getDayGridDateEl = (iso8601) ->
	els = getDayGridDateEls(iso8601)
	expect(els.length).toBe(1)
	els.eq(0)


getDayGridResourceRect = (resourceTitle, dayDateString) ->
	resourceEls = getResourceHeadEls(resourceTitle)
	resourceRects =
		for node in resourceEls
			getBoundingRect(node)
	dayEls = getDayGridDateBodyEls(dayDateString)
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