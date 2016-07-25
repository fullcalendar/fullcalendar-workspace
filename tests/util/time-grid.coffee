
###
for a single segment
###
getResourceTimeGridRect = (resourceId, start, end) ->
	start = $.fullCalendar.moment.parseZone(start)
	end = $.fullCalendar.moment.parseZone(end)

	startTime = start.time()
	endTime =
		if end.isSame(start, 'day')
			end.time()
		else if end < start
			startTime
		else
			moment.duration({ hours: 24 })

	dayEls = getResourceTimeGridDayEls(resourceId, start)
	if dayEls.length == 1
		dayRect = getBoundingRect(dayEls.eq(0))
		{
			left: dayRect.left
			right: dayRect.right
			top: getTimeGridTop(startTime)
			bottom: getTimeGridTop(endTime)
		}


getResourceTimeGridPoint = (resourceId, date) ->
	date = $.fullCalendar.moment.parseZone(date)

	dayEls = getResourceTimeGridDayEls(resourceId, date)
	if dayEls.length == 1
		dayRect = getBoundingRect(dayEls.eq(0))
		{
			left: (dayRect.left + dayRect.right) / 2
			top: getTimeGridTop(date.time())
		}
	else
		null


getTimeGridPoint = (date) ->
	date = $.fullCalendar.moment.parseZone(date)

	dayEls = getTimeGridDayEls(date)
	if dayEls.length == 1
		dayRect = getBoundingRect(dayEls.eq(0))
		{
			left: (dayRect.left + dayRect.right) / 2
			top: getTimeGridTop(date.time())
		}
	else
		null

###
targetTime is a time (duration) that can be in between slots
###
getTimeGridTop = (targetTime) ->
	targetTime = moment.duration(targetTime)
	slotEls = getTimeGridSlotEls(targetTime)
	topBorderWidth = 1 # TODO: kill

	# exact slot match
	if slotEls.length == 1
		return slotEls.eq(0).offset().top + topBorderWidth

	slotEls = $('.fc-time-grid .fc-slats tr[data-time]') # all slots
	slotTime = null
	prevSlotTime = null

	for slotEl, i in slotEls # traverse earlier to later
		slotEl = $(slotEl)

		prevSlotTime = slotTime
		slotTime = moment.duration(slotEl.data('time'))

		# is target time between start of previous slot but before this one?
		if targetTime < slotTime
			# before first slot
			if not prevSlotTime
				return slotEl.offset().top + topBorderWidth
			else
				prevSlotEl = slotEls.eq(i - 1)
				return prevSlotEl.offset().top + # previous slot top
					topBorderWidth +
					prevSlotEl.outerHeight() *
					((targetTime - prevSlotTime) / (slotTime - prevSlotTime))

	# target time must be after the start time of the last slot.
	# `slotTime` is set to the start time of the last slot.

	# guess the duration of the last slot, based on previous duration
	slotMsDuration = slotTime - prevSlotTime

	slotEl.offset().top + # last slot's top
		topBorderWidth +
		slotEl.outerHeight() *
		Math.min(1, (targetTime - slotTime) / slotMsDuration) # don't go past end of last slot


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
	if date.date() == 1 # ensure no time overflow/underflow
		$('.fc-time-grid .fc-slats tr[data-time="' + date.format('HH:mm:ss') + '"]')
	else
		$()


getTimeGridResourceIds = ->
	$('.fc-agenda-view .fc-head .fc-resource-cell').map (i, th) ->
		$(th).data('resource-id')
	.get() # jQuery -> array


# TODO: discourage use
getTimeGridDowEls = (dayAbbrev) ->
	$('.fc-time-grid .fc-day.fc-' + dayAbbrev)
