
getResourceTimeGridPoint = (resourceId, date) ->
	date = $.fullCalendar.moment.parseZone(date)
	top = getTimeGridTop(date.time())
	dayEls = getResourceTimeGridDayEls(resourceId, date)
	expect(dayEls.length).toBe(1)
	dayRect = getBoundingRect(dayEls.eq(0))
	{
		left: (dayRect.left + dayRect.right) / 2
		top: top
	}


getTimeGridPoint = (date) ->
	date = $.fullCalendar.moment.parseZone(date)
	top = getTimeGridTop(date.time())
	dayEls = getTimeGridDayEls(date)
	expect(dayEls.length).toBe(1)
	dayRect = getBoundingRect(dayEls.eq(0))
	{
		left: (dayRect.left + dayRect.right) / 2
		top: top
	}


getTimeGridTop = (time) ->
	time = moment.duration(time)
	slotEls = getTimeGridSlotEls(time)
	expect(slotEls.length).toBe(1)
	slotEls.offset().top + 1 # +1 make sure after border


getResourceTimeGridDayEls = (resourceId, date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-time-grid .fc-day[data-date="' + date.format('YYYY-MM-DD') + '"]' +
		'[data-resource-id="' + resourceId + '"]')


getTimeGridDayEls = (date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-time-grid .fc-day[data-date="' + date.format('YYYY-MM-DD') + '"]')


getTimeGridSlotEls = (timeDuration) ->
	timeDuration = moment.duration(timeDuration)
	date = $.fullCalendar.moment.utc('2016-01-01').time(timeDuration)
	$('.fc-time-grid .fc-slats tr[data-time="' + date.format('HH:mm:ss') + '"]')


getTimeGridResourceIds = ->
	$('.fc-agenda-view .fc-head .fc-resource-cell').map (i, th) ->
		$(th).data('resource-id')
	.get() # jQuery -> array


# TODO: discourage use
getTimeGridDowEls = (dayAbbrev) ->
	$('.fc-time-grid .fc-day.fc-' + dayAbbrev)
