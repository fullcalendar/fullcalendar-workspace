
getResourceTimelinePoint = (resourceId, date, slatOffset) ->
	rowRect = getBoundingRect(getTimelineRowEl(resourceId))
	left = getTimelineLeft(date, slatOffset)
	{
		left: left
		top: (rowRect.top + rowRect.bottom) / 2
	}


getTimelinePoint = (date, slatOffset) ->
	contentRect = getBoundingRect($('.fc-body .fc-time-area .fc-content'))
	left = getTimelineLeft(date, slatOffset)
	{
		left: left
		top: (contentRect.top + contentRect.bottom) / 2
	}


getTimelineLine = (date, slatOffset) ->
	contentRect = getBoundingRect($('.fc-body .fc-time-area .fc-content'))
	left = getTimelineLeft(date, slatOffset)
	{
		left: left
		right: left
		top: contentRect.top
		bottom: contentRect.bottom
	}


getTimelineLeft = (date, slatOffset=0) ->
	slatEl = getTimelineSlatEl(date)
	expect(slatEl.length).toBe(1)
	slatWidth = slatEl.outerWidth()
	# go 1px into slot, to guarantee avoiding border
	if isElWithinRtl(slatEl)
		slatEl.offset().left + slatWidth - slatWidth * slatOffset - 1
	else
		slatEl.offset().left + slatWidth * slatOffset + 1


getTimelineRowEl = (resourceId) ->
	$('.fc-body .fc-resource-area tr[data-resource-id="' + resourceId + '"]')


getTimelineSlatEl = (date) ->
	date = $.fullCalendar.moment.parseZone(date)
	$('.fc-body .fc-slats td[data-date="' + date.format() + '"]')


getTimelineResourceIds = ->
	$('.fc-body .fc-resource-area tr[data-resource-id]').map (i, tr) ->
		$(tr).data('resource-id')
	.get() # jquery -> array
