
# for both day-grid time-grid

# rename: query?
# TODO: get data-time or data-date into every view
# TODO: get data-resource-id into every view
# TODO: always receive resource name in every method. no more leading/trailing/index


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


getDowBodyEls = (dayAbbrev, viewType) ->
	if viewType == 'agenda'
		getTimeGridDowBodyEls(dayAbbrev)
	else
		getDayGridDowBodyEls(dayAbbrev)