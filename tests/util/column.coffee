
getHeadDateEls = (date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-day-header[data-date="' + date.format('YYYY-MM-DD') + '"]')


# date optional
getHeadResourceEls = (resourceId, date) ->
	datePart = ''
	if date
		date = $.fullCalendar.moment.parseZone(date)
		datePart = '[data-date="' + date.format('YYYY-MM-DD') + '"]'
	$('.fc-resource-cell' +
		'[data-resource-id="' + resourceId + '"]' +
		datePart)


# resourceId is required
getHeadResourceDateEls = (date, resourceId) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-day-header' +
		'[data-date="' + date.format('YYYY-MM-DD') + '"]' +
		'[data-resource-id="' + resourceId + '"]')


# TODO: discourage use
getHeadDowEls = (dayAbbrev) ->
	$('.fc-day-header.fc-' + dayAbbrev)


# TODO: discourage use
getBodyDowEls = (dayAbbrev, viewType) ->
	if viewType == 'agenda'
		getTimeGridDowEls(dayAbbrev)
	else
		getDayGridDowEls(dayAbbrev)
