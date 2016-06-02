
cssToStr = FC.cssToStr


class TimelineGrid extends Grid

	# FYI: the start/end properties have timezones stripped,
	# even if the calendar/view has a timezone.

	slotDates: null # has stripped timezones
	slotCnt: null
	snapCnt: null
	snapsPerSlot: null
	snapDiffToIndex: null # maps number of snaps since the grid's start to the index
	snapIndexToDiff: null # inverse

	headEl: null
	slatContainerEl: null
	slatEls: null # in DOM order

	containerCoordCache: null
	slatCoordCache: null # used for hit detection

	# for the inner divs within the slats
	# used for event rendering and scrollTime, to disregard slat border
	slatInnerCoordCache: null

	headScroller: null
	bodyScroller: null
	joiner: null
	follower: null
	eventTitleFollower: null

	minTime: null
	maxTime: null
	timeWindowMs: null
	slotDuration: null
	snapDuration: null

	duration: null
	labelInterval: null
	headerFormats: null
	isTimeScale: null
	largeUnit: null # if the slots are > a day, the string name of the interval

	emphasizeWeeks: false

	titleFollower: null

	segContainerEl: null
	segContainerHeight: null
	bgSegContainerEl: null
	helperEls: null
	innerEl: null


	constructor: ->
		super

		@initScaleProps()

		# TODO: more formal option system. works with Agenda
		@minTime = moment.duration(@opt('minTime') || '00:00')
		@maxTime = moment.duration(@opt('maxTime') || '24:00')
		@timeWindowMs = @maxTime - @minTime

		@snapDuration =
			if (input = @opt('snapDuration'))
				moment.duration(input)
			else
				@slotDuration

		@minResizeDuration = @snapDuration # for Grid

		@snapsPerSlot = divideDurationByDuration(@slotDuration, @snapDuration)
			# TODO: do this in initScaleProps?

		@slotWidth = @opt('slotWidth')


	opt: (name) -> # shortcut
		@view.opt(name)


	isValidDate: (date) ->
		if @view.isHiddenDay(date)
			false
		else if @isTimeScale
			# determine if the time is within minTime/maxTime, which may have wacky values
			ms = date.time() - @minTime # milliseconds since minTime
			ms = ((ms % 86400000) + 86400000) % 86400000 # make negative values wrap to 24hr clock
			ms < @timeWindowMs # before the maxTime?
		else
			true


	computeDisplayEventTime: ->
		not @isTimeScale # because times should be obvious via axis


	computeDisplayEventEnd: ->
		false


	# Computes a default event time formatting string if `timeFormat` is not explicitly defined
	computeEventTimeFormat: ->
		@opt('extraSmallTimeFormat')


	# Dates
	# ---------------------------------------------------------------------------------


	###
	Makes the given date consistent with isTimeScale/largeUnit,
	so, either removes the times, ensures a time, or makes it the startOf largeUnit.
	Strips all timezones. Returns new copy.
	TODO: should maybe be called "normalizeRangeDate".
	###
	normalizeGridDate: (date) ->
		if @isTimeScale
			normalDate = date.clone()
			if not normalDate.hasTime()
				normalDate.time(0)
		else
			normalDate = date.clone().stripTime()
			if @largeUnit
				normalDate.startOf(@largeUnit)
		normalDate


	normalizeGridRange: (range) ->
		if @isTimeScale
			normalRange =
				start: @normalizeGridDate(range.start)
				end: @normalizeGridDate(range.end)
		else
			normalRange = @view.computeDayRange(range)

			if @largeUnit
				normalRange.start.startOf(@largeUnit)

				# if date is partially through the interval, or is in the same interval as the start,
				# make the exclusive end be the *next* interval
				adjustedEnd = normalRange.end.clone().startOf(@largeUnit)
				if not adjustedEnd.isSame(normalRange.end) or not adjustedEnd.isAfter(normalRange.start)
					adjustedEnd.add(@slotDuration)
				normalRange.end = adjustedEnd

		normalRange


	rangeUpdated: ->
		# makes sure zone is stripped
		@start = @normalizeGridDate(@start)
		@end = @normalizeGridDate(@end)

		# apply minTime/maxTime
		# TODO: move towards .time(), but didn't play well with negatives
		if @isTimeScale
			@start.add(@minTime)
			@end.subtract(1, 'day').add(@maxTime)

		slotDates = []
		date = @start.clone()
		while date < @end
			if @isValidDate(date)
				slotDates.push(date.clone())
			date.add(@slotDuration)

		@slotDates = slotDates
		@updateGridDates()


	updateGridDates: ->
		snapIndex = -1
		snapDiff = 0 # index of the diff :(
		snapDiffToIndex = []
		snapIndexToDiff = []

		date = @start.clone()
		while date < @end
			if @isValidDate(date)
				snapIndex++
				snapDiffToIndex.push(snapIndex)
				snapIndexToDiff.push(snapDiff)
			else
				snapDiffToIndex.push(snapIndex + 0.5)
			date.add(@snapDuration)
			snapDiff++

		@snapDiffToIndex = snapDiffToIndex
		@snapIndexToDiff = snapIndexToDiff

		@snapCnt = snapIndex + 1 # is always one behind
		@slotCnt = @snapCnt / @snapsPerSlot


	spanToSegs: (span) ->
		normalRange = @normalizeGridRange(span)

		# protect against when the span is entirely in an invalid date region
		if @computeDateSnapCoverage(span.start) < @computeDateSnapCoverage(span.end)

			# `this` has a start/end, an already normalized range.
			# zones will have been stripped (a requirement for intersectRanges)
			seg = intersectRanges(normalRange, this)

			# TODO: what if month slots? should round it to nearest month
			# TODO: dragging/resizing in this situation? deltas for dragging/resizing breaks down

			if seg
				if seg.isStart and not @isValidDate(seg.start)
					seg.isStart = false

				if seg.isEnd and seg.end and not @isValidDate(seg.end.clone().subtract(1))
					seg.isEnd = false

				return [ seg ]

		return []


	# Hit System
	# ---------------------------------------------------------------------------------


	prepareHits: ->
		@buildCoords()


	# FYI: we don't want to clear the slatCoordCache in releaseHits()
	# because those coordinates are needed for dateToCoord()


	queryHit: (leftOffset, topOffset) ->
		snapsPerSlot = @snapsPerSlot
		slatCoordCache = @slatCoordCache
		containerCoordCache = @containerCoordCache

		if containerCoordCache.getVerticalIndex(topOffset)? # vertically in bounds?

			slatIndex = slatCoordCache.getHorizontalIndex(leftOffset)
			if slatIndex?
				slatWidth = slatCoordCache.getWidth(slatIndex)

				if @isRTL
					slatRight = slatCoordCache.getRightOffset(slatIndex)
					partial = (slatRight - leftOffset) / slatWidth
					localSnapIndex = Math.floor(partial * snapsPerSlot)
					snapIndex = slatIndex * snapsPerSlot + localSnapIndex
					snapRight = slatRight - (localSnapIndex / snapsPerSlot) * slatWidth
					snapLeft = snapRight - ((localSnapIndex + 1) / snapsPerSlot) * slatWidth
				else
					slatLeft = slatCoordCache.getLeftOffset(slatIndex)
					partial = (leftOffset - slatLeft) / slatWidth
					localSnapIndex = Math.floor(partial * snapsPerSlot)
					snapIndex = slatIndex * snapsPerSlot + localSnapIndex
					snapLeft = slatLeft + (localSnapIndex / snapsPerSlot) * slatWidth
					snapRight = slatLeft + ((localSnapIndex + 1) / snapsPerSlot) * slatWidth

				{
					snap: snapIndex
					component: this # needed unfortunately
					left: snapLeft
					right: snapRight
					top: containerCoordCache.getTopOffset(0),
					bottom: containerCoordCache.getBottomOffset(0)
				}


	getHitSpan: (hit) ->
		@getSnapRange(hit.snap)


	getHitEl: (hit) ->
		@getSnapEl(hit.snap) # TODO: write a test for this


	# Snap Utils
	# ---------------------------------------------------------------------------------


	getSnapRange: (snapIndex) ->
		start = @start.clone()
		start.add(multiplyDuration(@snapDuration, @snapIndexToDiff[snapIndex]))
		end = start.clone().add(@snapDuration)
		{ start, end }


	getSnapEl: (snapIndex) ->
		@slatEls.eq(Math.floor(snapIndex / @snapsPerSlot))


	# Main Rendering
	# ---------------------------------------------------------------------------------


	renderSkeleton: ->

		@headScroller = new ClippedScroller
			overflowX: 'clipped-scroll'
			overflowY: 'hidden'
		@headScroller.canvas = new ScrollerCanvas()
		@headScroller.render()
		@headEl.append(@headScroller.el)

		@bodyScroller = new ClippedScroller()
		@bodyScroller.canvas = new ScrollerCanvas()
		@bodyScroller.render()
		@el.append(@bodyScroller.el)

		@innerEl = @bodyScroller.canvas.contentEl # TODO: temporary

		@slatContainerEl = $('<div class="fc-slats"/>').appendTo(@bodyScroller.canvas.bgEl)
		@segContainerEl = $('<div class="fc-event-container"/>').appendTo(@bodyScroller.canvas.contentEl)
		@bgSegContainerEl = @bodyScroller.canvas.bgEl

		@containerCoordCache = new CoordCache
			els: @bodyScroller.canvas.el # better representative of bounding box, considering annoying negative margins
			isHorizontal: true # we use the left/right for adjusting RTL coordinates
			isVertical: true

		@joiner = new ScrollJoiner('horizontal', [ @headScroller, @bodyScroller ])

		if true
			@follower = new ScrollFollower(@headScroller, @view.calendar.isTouch)

		if true
			@eventTitleFollower = new ScrollFollower(@bodyScroller, @view.calendar.isTouch)
			@eventTitleFollower.minTravel = 50
			if @isRTL
				@eventTitleFollower.containOnNaturalRight = true
			else
				@eventTitleFollower.containOnNaturalLeft = true

		super


	headColEls: null
	slatColEls: null


	renderDates: ->
		@headScroller.canvas.contentEl.html(@renderHeadHtml())
		@headColEls = @headScroller.canvas.contentEl.find('col')
		@slatContainerEl.html(@renderSlatHtml())
		@slatColEls = @slatContainerEl.find('col')
		@slatEls = @slatContainerEl.find('td')

		@slatCoordCache = new CoordCache
			els: @slatEls
			isHorizontal: true

		@slatInnerCoordCache = new CoordCache
			els: @slatEls.find('> div')
			isHorizontal: true
			# we use this coord cache for getPosition* for event rendering.
			# workaround for .fc-content's negative margins.
			offsetParent: @bodyScroller.canvas.el

		for date, i in @slotDates
			@view.trigger('dayRender', null, date, @slatEls.eq(i))

		if @follower
			@follower.setSprites(@headEl.find('tr:not(:last-child) span'))


	unrenderDates: ->
		if @follower
			@follower.clearSprites()

		@headScroller.canvas.contentEl.empty()
		@slatContainerEl.empty()

		# clear the widths,
		# for no jupiness when navigating
		@headScroller.canvas.clearWidth()
		@bodyScroller.canvas.clearWidth()


	renderHeadHtml: -> # TODO: misnamed
		labelInterval = @labelInterval
		formats = @headerFormats
		cellRows = ([] for format in formats) # indexed by row,col
		leadingCell = null
		prevWeekNumber = null
		slotDates = @slotDates
		slotCells = [] # meta

		for date in slotDates
			weekNumber = date.week()
			isWeekStart = @emphasizeWeeks and prevWeekNumber != null and prevWeekNumber != weekNumber

			for format, row in formats
				rowCells = cellRows[row]
				leadingCell = rowCells[rowCells.length - 1]
				isSuperRow = formats.length > 1 and row < formats.length - 1 # more than one row and not the last
				newCell = null

				if isSuperRow
					text = date.format(format)
					dateData = date.format()
					if !leadingCell or leadingCell.text != text
						newCell = { text, dateData, colspan: 1 }
					else
						leadingCell.colspan += 1
				else
					if !leadingCell or isInt(divideRangeByDuration(@start, date, labelInterval))
						text = date.format(format)
						dateData = date.format()
						newCell = { text, dateData, colspan: 1 }
					else
						leadingCell.colspan += 1

				if newCell
					newCell.weekStart = isWeekStart
					rowCells.push(newCell)

			slotCells.push({ weekStart: isWeekStart })
			prevWeekNumber = weekNumber

		isChrono = labelInterval > @slotDuration

		html = '<table>'
		html += '<colgroup>'
		for date in slotDates
			html += '<col/>'
		html += '</colgroup>'
		html += '<tbody>'
		for rowCells, i in cellRows
			isLast = i == cellRows.length - 1
			html += '<tr' + (if isChrono and isLast then ' class="fc-chrono"' else '') + '>'
			for cell in rowCells
				html +=
					'<th class="' +
							@view.widgetHeaderClass + ' ' +
							(if cell.weekStart then 'fc-em-cell' else '') +
						'"' +
						' data-date="' + cell.dateData + '"' +
						(if cell.colspan > 1 then ' colspan="' + cell.colspan + '"' else '') +
					'>' +
						'<div class="fc-cell-content">' +
							'<span class="fc-cell-text">' +
								htmlEscape(cell.text) +
							'</span>' +
						'</div>' +
					'</th>'

			html += '</tr>'
		html += '</tbody></table>'

		slatHtml = '<table>'
		slatHtml += '<colgroup>'
		for cell in slotCells
			slatHtml += '<col/>'
		slatHtml += '</colgroup>'
		slatHtml += '<tbody><tr>'
		for cell, i in slotCells
			date = slotDates[i]
			slatHtml += @slatCellHtml(date, cell.weekStart)
		slatHtml += '</tr></tbody></table>'
		@_slatHtml = slatHtml

		html


	renderSlatHtml: ->
		@_slatHtml # TODO: kill this hack


	slatCellHtml: (date, isEm) ->

		if @isTimeScale
			classes = []
			classes.push \
				if isInt(divideRangeByDuration(@start, date, @labelInterval))
					'fc-major'
				else
					'fc-minor'
		else
			classes = @getDayClasses(date)
			classes.push('fc-day')

		classes.unshift(@view.widgetContentClass)

		if isEm
			classes.push('fc-em-cell')

		'<td class="' + classes.join(' ') + '"' +
			' data-date="' + date.format() + '"' +
			'><div /></td>'


	#  Business Hours
	# ---------------------------------------------------------------------------------


	businessHourSegs: null


	renderBusinessHours: ->
		if not @largeUnit
			events = @view.calendar.getBusinessHoursEvents(not @isTimeScale)
			segs = @businessHourSegs = @eventsToSegs(events)
			@renderFill('businessHours', segs, 'bgevent')


	unrenderBusinessHours: ->
		@unrenderFill('businessHours')


	# Now Indicator
	# ---------------------------------------------------------------------------------


	nowIndicatorEls: null


	getNowIndicatorUnit: ->
		# TODO: converge with largeUnit. precompute
		if @isTimeScale
			computeIntervalUnit(@slotDuration)


	# will only execute if isTimeScale
	renderNowIndicator: (date) ->
		nodes = []
		date = @normalizeGridDate(date)
		if date >= @start and date < @end
			coord = @dateToCoord(date)
			css = if @isRTL
					{ right: -coord }
				else
					{ left: coord }

			nodes.push($("<div class='fc-now-indicator fc-now-indicator-arrow'></div>")
				.css(css)
				.appendTo(@headScroller.canvas.el)[0])

			nodes.push($("<div class='fc-now-indicator fc-now-indicator-line'></div>")
				.css(css)
				.appendTo(@bodyScroller.canvas.el)[0])

		@nowIndicatorEls = $(nodes)


	# will only execute if isTimeScale
	unrenderNowIndicator: ->
		if @nowIndicatorEls
			@nowIndicatorEls.remove()
			@nowIndicatorEls = null


	# Coordinates
	# ---------------------------------------------------------------------------------

	explicitSlotWidth: null
	defaultSlotWidth: null


	# NOTE: not related to Grid. this is TimelineGrid's own method
	updateWidth: ->

		# reason for this complicated method is that things went wrong when:
		#  slots/headers didn't fill content area and needed to be stretched
		#  cells wouldn't align (rounding issues with available width calculated
		#  differently because of padding VS scrollbar trick)

		slotWidth = Math.round(@slotWidth or= @computeSlotWidth())
		containerWidth = slotWidth * @slotDates.length
		containerMinWidth = ''
		nonLastSlotWidth = slotWidth

		availableWidth = @bodyScroller.getClientWidth()
		if availableWidth > containerWidth
			containerMinWidth = availableWidth
			containerWidth = ''
			nonLastSlotWidth = Math.floor(availableWidth / @slotDates.length)

		@headScroller.canvas.setWidth(containerWidth)
		@headScroller.canvas.setMinWidth(containerMinWidth)
		@bodyScroller.canvas.setWidth(containerWidth)
		@bodyScroller.canvas.setMinWidth(containerMinWidth)

		@headColEls.slice(0, -1).add(@slatColEls.slice(0, -1))
			.width(nonLastSlotWidth)

		@headScroller.updateSize()
		@bodyScroller.updateSize()
		@joiner.update()

		@buildCoords()
		@updateSegPositions()

		# this updateWidth method is triggered by callers who don't always subsequently call updateNowIndicator,
		# and updateWidth always has the risk of changing horizontal spacing which will affect nowIndicator positioning,
		# so always call it here too. will often rerender twice unfortunately.
		# TODO: more closely integrate updateSize with updateNowIndicator
		@view.updateNowIndicator()

		if @follower
			@follower.update()

		if @eventTitleFollower
			@eventTitleFollower.update()


	computeSlotWidth: -> # compute the *default*

		# TODO: harness core's `matchCellWidths` for this
		maxInnerWidth = 0
		innerEls = @headEl.find('tr:last-child th span') # TODO: cache
		innerEls.each (i, node) ->
			innerWidth = $(node).outerWidth()
			maxInnerWidth = Math.max(maxInnerWidth, innerWidth)

		headerWidth = maxInnerWidth + 1 # assume no padding, and one pixel border
		slotsPerLabel = divideDurationByDuration(@labelInterval, @slotDuration) # TODO: rename labelDuration?
		slotWidth = Math.ceil(headerWidth / slotsPerLabel)

		minWidth = @headColEls.eq(0).css('min-width')
		if minWidth
			minWidth = parseInt(minWidth, 10)
			if minWidth
				slotWidth = Math.max(slotWidth, minWidth)

		slotWidth


	buildCoords: ->
		@containerCoordCache.build()
		@slatCoordCache.build()
		@slatInnerCoordCache.build()


	# returned value is between 0 and the number of snaps
	computeDateSnapCoverage: (date) ->
		snapDiff = divideRangeByDuration(@start, date, @snapDuration)

		if snapDiff < 0
			0
		else if snapDiff >= @snapDiffToIndex.length
			@snapCnt
		else
			snapDiffInt = Math.floor(snapDiff)
			snapCoverage = @snapDiffToIndex[snapDiffInt]

			if isInt(snapCoverage) # not an in-between value
				snapCoverage += snapDiff - snapDiffInt # add the remainder
			else
				# a fractional value, meaning the date is not visible
				# always round up in this case. works for start AND end dates in a range.
				snapCoverage = Math.ceil(snapCoverage)

			snapCoverage


	# for LTR, results range from 0 to width of area
	# for RTL, results range from negative width of area to 0
	dateToCoord: (date) ->
		snapCoverage = @computeDateSnapCoverage(date)
		slotCoverage = snapCoverage / @snapsPerSlot
		slotIndex = Math.floor(slotCoverage)
		slotIndex = Math.min(slotIndex, @slotCnt - 1)
		partial = slotCoverage - slotIndex
		coordCache = @slatInnerCoordCache

		if @isRTL
			(coordCache.getRightPosition(slotIndex) -
				coordCache.getWidth(slotIndex) * partial) -
					@containerCoordCache.getWidth(0)
		else
			(coordCache.getLeftPosition(slotIndex) +
				coordCache.getWidth(slotIndex) * partial)


	rangeToCoords: (range) ->
		if @isRTL
			{ right: @dateToCoord(range.start), left: @dateToCoord(range.end) }
		else
			{ left: @dateToCoord(range.start), right: @dateToCoord(range.end) }


	# a getter / setter
	headHeight: ->
		table = @headScroller.canvas.contentEl.find('table')
		table.height.apply(table, arguments)


	# this needs to be called if v scrollbars appear on body container. or zooming
	updateSegPositions: ->
		segs = (@segs or []).concat(@businessHourSegs or [])

		for seg in segs
			coords = @rangeToCoords(seg)
			seg.el.css
				left: (seg.left = coords.left)
				right: -(seg.right = coords.right)
		return


	# Scrolling
	# ---------------------------------------------------------------------------------


	computeInitialScroll: (prevState) ->
		left = 0
		if @isTimeScale
			scrollTime = @opt('scrollTime')
			if scrollTime
				scrollTime = moment.duration(scrollTime)
				left = @dateToCoord(@start.clone().time(scrollTime)) # TODO: fix this for RTL
		{ left, top: 0 }


	queryScroll: ->
		{
			left: @bodyScroller.getScrollLeft()
			top: @bodyScroller.getScrollTop()
		}


	setScroll: (state) ->

		# TODO: workaround for FF. the ScrollJoiner sibling won't react fast enough
		# to override the native initial crappy scroll that FF applies.
		# TODO: have the ScrollJoiner handle this
		# Similar code in ResourceTimelineView::setScroll
		@headScroller.setScrollLeft(state.left)

		@headScroller.setScrollLeft(state.left)
		@bodyScroller.setScrollTop(state.top)


	# Events
	# ---------------------------------------------------------------------------------


	renderFgSegs: (segs) ->
		segs = @renderFgSegEls(segs)

		@renderFgSegsInContainers([[ this, segs ]])
		@updateSegFollowers(segs)

		segs


	unrenderFgSegs: ->
		@clearSegFollowers()
		@unrenderFgContainers([ this ])


	renderFgSegsInContainers: (pairs) ->

		for [ container, segs ] in pairs
			for seg in segs
				# TODO: centralize logic (also in updateSegPositions)
				coords = @rangeToCoords(seg)
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

		# attach segs
		for [ container, segs ] in pairs
			for seg in segs
				seg.el.appendTo(container.segContainerEl)

		# compute seg verticals
		for [ container, segs ] in pairs
			for seg in segs
				seg.height = seg.el.outerHeight(true) # include margin
			@buildSegLevels(segs)
			container.segContainerHeight = computeOffsetForSegs(segs) # returns this value!

		# assign seg verticals
		for [ container, segs ] in pairs
			for seg in segs
				seg.el.css('top', seg.top)
			container.segContainerEl.height(container.segContainerHeight)


	# NOTE: this modifies the order of segs
	buildSegLevels: (segs) ->
		segLevels = []

		@sortEventSegs(segs)

		for unplacedSeg in segs
			unplacedSeg.above = []

			# determine the first level with no collisions
			level = 0 # level index
			while level < segLevels.length
				isLevelCollision = false

				# determine collisions
				for placedSeg in segLevels[level]
					if timeRowSegsCollide(unplacedSeg, placedSeg)
						unplacedSeg.above.push(placedSeg)
						isLevelCollision = true

				if isLevelCollision
					level += 1
				else
					break

			# insert into the first non-colliding level. create if necessary
			(segLevels[level] or (segLevels[level] = []))
				.push(unplacedSeg)

			# record possible colliding segments below (TODO: automated test for this)
			level += 1
			while level < segLevels.length
				for belowSeg in segLevels[level]
					if timeRowSegsCollide(unplacedSeg, belowSeg)
						belowSeg.above.push(unplacedSeg)
				level += 1

		segLevels


	unrenderFgContainers: (containers) ->
		for container in containers
			container.segContainerEl.empty()
			container.segContainerEl.height('')
			container.segContainerHeight = null


	fgSegHtml: (seg, disableResizing) ->
		event = seg.event
		isDraggable = @view.isEventDraggable(event)
		isResizableFromStart = seg.isStart and @view.isEventResizableFromStart(event)
		isResizableFromEnd = seg.isEnd and @view.isEventResizableFromEnd(event)

		classes = @getSegClasses(seg, isDraggable, isResizableFromStart or isResizableFromEnd)
		classes.unshift('fc-timeline-event', 'fc-h-event')

		timeText = @getEventTimeText(event)

		'<a class="' + classes.join(' ') + '" style="' + cssToStr(@getSegSkinCss(seg)) + '"' +
			(if event.url
				' href="' + htmlEscape(event.url) + '"'
			else
				'') +
			'>' +
			'<div class="fc-content">' +
				(if timeText
					'<span class="fc-time">' +
						htmlEscape(timeText) +
					'</span>'
				else
					'') +
				'<span class="fc-title">' +
					(if event.title then htmlEscape(event.title) else '&nbsp;') +
				'</span>' +
			'</div>' +
			'<div class="fc-bg" />' +
			(if isResizableFromStart
				'<div class="fc-resizer fc-start-resizer"></div>'
			else
				'') +
			(if isResizableFromEnd
				'<div class="fc-resizer fc-end-resizer"></div>'
			else
				'') +
		'</a>'


	updateSegFollowers: (segs) ->
		if @eventTitleFollower
			sprites = []
			for seg in segs
				titleEl = seg.el.find('.fc-title')
				if titleEl.length
					sprites.push(new ScrollFollowerSprite(titleEl))
			@eventTitleFollower.setSprites(sprites)


	clearSegFollowers: ->
		if @eventTitleFollower
			@eventTitleFollower.clearSprites()


	segDragStart: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.forceRelative()


	segDragEnd: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.clearForce()


	segResizeStart: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.forceRelative()


	segResizeEnd: ->
		super

		if @eventTitleFollower
			@eventTitleFollower.clearForce()


	# Helper
	# ---------------------------------------------------------------------------------


	renderHelper: (event, sourceSeg) ->
		segs = @eventToSegs(event)
		segs = @renderFgSegEls(segs)
		@renderHelperSegsInContainers([[ this, segs ]], sourceSeg)


	renderHelperSegsInContainers: (pairs, sourceSeg) ->
		helperNodes = [] # .fc-event-container
		segNodes = [] # .fc-event

		for [ containerObj, segs ] in pairs
			for seg in segs

				# TODO: centralize logic (also in renderFgSegsInContainers)
				coords = @rangeToCoords(seg)
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

				# FYI: containerObj is either the Grid or a ResourceRow
				# TODO: detangle the concept of resources
				if sourceSeg and sourceSeg.resourceId == containerObj.resource?.id
					seg.el.css('top', sourceSeg.el.css('top'))
				else
					seg.el.css('top', 0)

		for [ containerObj, segs ] in pairs

			helperContainerEl = $('<div class="fc-event-container fc-helper-container"/>')
				.appendTo(containerObj.innerEl)

			helperNodes.push(helperContainerEl[0])

			for seg in segs
				helperContainerEl.append(seg.el)
				segNodes.push(seg.el[0])

		if (@helperEls)
			@helperEls = @helperEls.add($(helperNodes))
		else
			@helperEls = $(helperNodes)

		$(segNodes) # return value


	unrenderHelper: ->
		if @helperEls
			@helperEls.remove()
			@helperEls = null


	# Renders a visual indication of an event being resized
	renderEventResize: (resizeLocation, seg) ->
		@renderHighlight(@eventToSpan(resizeLocation))
		@renderEventLocationHelper(resizeLocation, seg) # return value. rendered seg els


	# Unrenders a visual indication of an event being resized
	unrenderEventResize: ->
		@unrenderHighlight()
		@unrenderHelper()


	# Fill
	# ---------------------------------------------------------------------------------


	renderFill: (type, segs, className) ->
		segs = @renderFillSegEls(type, segs) # pass in className?
		@renderFillInContainers(type, [[ this, segs ]], className)
		segs


	renderFillInContainers: (type, pairs, className) ->
		for [ containerObj, segs ] in pairs
			@renderFillInContainer(type, containerObj, segs, className)


	renderFillInContainer: (type, containerObj, segs, className) ->
		if segs.length

			className or= type.toLowerCase()

			# making a new container each time is OKAY
			# all types of segs (background or business hours or whatever) are rendered in one pass
			containerEl = $('<div class="fc-' + className + '-container" />')
				.appendTo(containerObj.bgSegContainerEl)

			for seg in segs
				coords = @rangeToCoords(seg) # TODO: centralize logic
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

				seg.el.appendTo(containerEl)

			# TODO: better API
			if @elsByFill[type]
				@elsByFill[type] = @elsByFill[type].add(containerEl)
			else
				@elsByFill[type] = containerEl


	# DnD
	# ---------------------------------------------------------------------------------


	# TODO: different technique based on scale.
	#  when dragging, middle of event is the drop.
	#  should be the edges when isTimeScale.
	renderDrag: (dropLocation, seg) ->
		if seg
			@renderEventLocationHelper(dropLocation, seg) # return value. rendered seg els
		else
			@renderHighlight(@eventToSpan(dropLocation))
			null # signals no helper els rendered


	unrenderDrag: ->
		@unrenderHelper()
		@unrenderHighlight()


# Seg Rendering Utils
# ----------------------------------------------------------------------------------------------------------------------
# TODO: move


computeOffsetForSegs = (segs) ->
	max = 0
	for seg in segs
		max = Math.max(max, computeOffsetForSeg(seg))
	max


computeOffsetForSeg = (seg) ->
	if not seg.top?
		seg.top = computeOffsetForSegs(seg.above)
	seg.top + seg.height


timeRowSegsCollide = (seg0, seg1) ->
	seg0.left < seg1.right and seg0.right > seg1.left
