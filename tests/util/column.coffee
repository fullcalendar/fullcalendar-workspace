
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


# either a day cell OR a resource cell
getHeadResourceTh = (resourceId, date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('th[data-resource-id="' + resourceId + '"]' +
		'[data-date="' + date.format('YYYY-MM-DD') + '"]')


getHeadResourceTitles = ->
	$('th[data-resource-id]').map (i, th) ->
		$(th).text()
	.get() # jQuery -> Array


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
