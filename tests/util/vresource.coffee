
checkDowHeadEl = (dayAbbrev) ->
	els = getDowHeadEls(dayAbbrev)
	expect(els.length).toBe(1)
	els


getDowHeadEls = (dayAbbrev) ->
	$('th.fc-' + dayAbbrev)


checkResourceHeadEl = (resourceTitle) ->
	els = getResourceHeadEls(resourceTitle)
	expect(els.length).toBe(1)
	els


getResourceHeadEls = (resourceTitle) ->
	$('th.fc-resource-cell:contains(' + resourceTitle + ')')


checkDowBodyEls = (dayAbbrev, viewType) -> # todo: rename from "check" ? "lone"
	if viewType == 'agenda'
		checkTimeGridDowBodyEl(dayAbbrev)
	else
		checkDayGridDowBodyEl(dayAbbrev)


checkTimeGridDowBodyEl = (dayAbbrev) ->
	els = getTimeGridDowBodyEls(dayAbbrev)
	expect(els.length).toBe(1)
	els


checkDayGridDowBodyEl = (dayAbbrev) ->
	els = getDayGridDowBodyEls(dayAbbrev)
	expect(els.length).toBe(1)
	els


getDowBodyEls = (dayAbbrev, viewType) ->
	if viewType == 'agenda'
		getTimeGridDowBodyEls(dayAbbrev)
	else
		getDayGridDowBodyEls(dayAbbrev)


getTimeGridDowBodyEls = (dayAbbrev) ->
	$('.fc-time-grid td.fc-day.fc-' + dayAbbrev)


getDayGridDowBodyEls = (dayAbbrev) ->
	$('.fc-day-grid .fc-row:first-child td.fc-day.fc-' + dayAbbrev)