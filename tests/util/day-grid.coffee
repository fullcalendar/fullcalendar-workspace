
getResourceDayGridDayEls = (resourceId, date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-day-grid .fc-day[data-date="' + date.format('YYYY-MM-DD') + '"]' +
		'[data-resource-id="' + resourceId + '"]')


getDayGridDayEls = (date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-day-grid .fc-day[data-date="' + date.format('YYYY-MM-DD') + '"]')


# TODO: discourage use
getDayGridDowEls = (dayAbbrev) ->
	$('.fc-day-grid .fc-row:first-child td.fc-day.fc-' + dayAbbrev)
