
getTimelineResourcePoint = (resourceText, timeText, labelIndex=0, slatOffset=0) ->
	resourceRect = getBoundingRect(getTimelineBodyResourceEl(resourceText))
	timePoint = getTimelineSlatPoint(timeText, labelIndex, slatOffset)
	{
		left: timePoint.left
		top: (resourceRect.top + resourceRect.bottom) / 2
	}


isElWithinRtl = (el) ->
	el.closest('.fc').hasClass('fc-rtl')


getTimelineSlatPoint = (timeText, labelIndex=0, slatOffset=0) ->
	slatInt = Math.floor(slatOffset)
	slatRemainder = slatOffset - slatInt
	slatEl = getTimelineSlatEl(timeText, labelIndex, slatInt)
	slatRect = getBoundingRect(slatEl)
	delta =
		if slatRemainder
			slatEl.outerWidth() * slatRemainder
		else
			0
	if isElWithinRtl(slatEl)
		slatLeft = slatRect.right - 1 - delta
	else
		slatLeft = slatRect.left + 1 + delta # one to make sure no border issues
	{
		left: slatLeft,
		top: (slatRect.top + slatRect.bottom) / 2
	}


getTimelineSlatEl = (timeText, labelIndex=0, slatOffset=0) ->
	thEl = $('.fc-head .fc-time-area .fc-cell-text:contains(' + timeText + '):eq(' + labelIndex + ')')
		.parent().parent()
	thIndex = thEl.prevAll().length
	thColspan = parseInt(thEl.attr('colspan') || 1)
	slatIndex = thIndex * thColspan + slatOffset
	$('.fc-body .fc-time-area .fc-slats td:eq(' + slatIndex + ')')


getTimelineBodyResourceEl = (resourceText) ->
	trEl = $('.fc-body .fc-resource-area .fc-cell-text:contains(' + resourceText + ')')
		.closest('tr')
	trIndex = trEl.prevAll().length
	$('.fc-body .fc-time-area .fc-rows tr:eq(' + trIndex + ')')
