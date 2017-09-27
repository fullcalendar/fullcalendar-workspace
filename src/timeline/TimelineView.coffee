
class TimelineView extends View

	@mixin(StandardInteractionsMixin)

	# config
	usesMinMaxTime: true # for View. indicates that minTime/maxTime affects rendering

	# TODO: rename these
	eventRendererClass: TimelineEventRenderer
	fillRendererClass: TimelineFillRenderer
	businessHourRendererClass: BusinessHourRenderer
	helperRendererClass: TimelineHelperRenderer
	eventDraggingClass: TimelineEventDragging
	eventResizingClass: TimelineEventResizing

	# date computation
	normalizedUnzonedRange: null # unzonedRange normalized and converted to Moments
	normalizedUnzonedStart: null # "
	normalizedUnzonedEnd: null   # "
	slotDates: null # has stripped timezones
	slotCnt: null
	snapCnt: null
	snapsPerSlot: null
	snapDiffToIndex: null # maps number of snaps since the grid's start to the index
	snapIndexToDiff: null # inverse
	timeWindowMs: null
	slotDuration: null
	snapDuration: null
	duration: null
	labelInterval: null
	isTimeScale: null
	largeUnit: null # if the slots are > a day, the string name of the interval
	headerFormats: null
	emphasizeWeeks: false

	# rendering
	timeHeadEl: null
	timeHeadColEls: null
	timeHeadScroller: null
	timeBodyEl: null
	timeBodyScroller: null
	timeScrollJoiner: null
	headDateFollower: null
	eventTitleFollower: null
	segContainerEl: null
	segContainerHeight: null
	bgSegContainerEl: null
	slatContainerEl: null
	slatColEls: null
	slatEls: null # in DOM order

	# coordinates
	timeBodyBoundCache: null
	slatCoordCache: null # used for hit detection
	slatInnerCoordCache: null

	nowIndicatorEls: null

	isTimeBodyScrolled: false


	constructor: ->
		super

		@slotWidth = @opt('slotWidth')


	# Footprints
	# ------------------------------------------------------------------------------------------------------------------


	###
	TODO: avoid using Moments. use slat system somehow
	THEN, can have componentFootprintToSegs handle this on its own
	###
	normalizeComponentFootprint: (componentFootprint) ->
		unzonedRange = componentFootprint.unzonedRange

		if @isTimeScale
			adjustedStart = @normalizeGridDate(unzonedRange.getStart())
			adjustedEnd = @normalizeGridDate(unzonedRange.getEnd())
		else
			dayRange = @computeDayRange(unzonedRange)

			if @largeUnit
				adjustedStart = dayRange.start.clone().startOf(@largeUnit)
				adjustedEnd = dayRange.end.clone().startOf(@largeUnit)

				# if date is partially through the interval, or is in the same interval as the start,
				# make the exclusive end be the *next* interval
				if not adjustedEnd.isSame(dayRange.end) or not adjustedEnd.isAfter(adjustedStart)
					adjustedEnd.add(@slotDuration)

			else
				adjustedStart = dayRange.start
				adjustedEnd = dayRange.end

		new ComponentFootprint(
			new UnzonedRange(adjustedStart, adjustedEnd)
			not @isTimeScale # isAllDay
		)


	componentFootprintToSegs: (footprint) ->
		footprintStart = footprint.unzonedRange.getStart()
		footprintEnd = footprint.unzonedRange.getEnd()
		normalFootprint = @normalizeComponentFootprint(footprint)
		segs = []

		# protect against when the span is entirely in an invalid date region
		if @computeDateSnapCoverage(footprintStart) < @computeDateSnapCoverage(footprintEnd)

			# intersect the footprint's range with the grid'd range
			segRange = normalFootprint.unzonedRange.intersect(@normalizedUnzonedRange)

			if segRange
				segStart = segRange.getStart()
				segEnd = segRange.getEnd()
				segs.push({
					start: segStart
					end: segEnd
					isStart: segRange.isStart and @isValidDate(segStart)
					isEnd: segRange.isEnd and @isValidDate(segEnd.clone().subtract(1))
				})

			# TODO: what if month slots? should round it to nearest month
			# TODO: dragging/resizing in this situation? deltas for dragging/resizing breaks down

		segs


	# Date Computation
	# ------------------------------------------------------------------------------------------------------------------


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


	isValidDate: (date) ->
		if @isHiddenDay(date)
			false
		else if @isTimeScale
			# determine if the time is within minTime/maxTime, which may have wacky values
			ms = date.time() - @dateProfile.minTime # milliseconds since minTime
			ms = ((ms % 86400000) + 86400000) % 86400000 # make negative values wrap to 24hr clock
			ms < @timeWindowMs # before the maxTime?
		else
			true


	updateGridDates: ->
		snapIndex = -1
		snapDiff = 0 # index of the diff :(
		snapDiffToIndex = []
		snapIndexToDiff = []

		date = @normalizedUnzonedStart.clone()
		while date < @normalizedUnzonedEnd
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


	# Skeleton Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderSkeleton: ->
		@el.addClass('fc-timeline')

		if @opt('eventOverlap') == false
			@el.addClass('fc-no-overlap')

		@el.html(@renderSkeletonHtml())

		@timeHeadEl = @el.find('thead .fc-time-area')
		@timeBodyEl = @el.find('tbody .fc-time-area')

		@timeHeadScroller = new ClippedScroller
			overflowX: 'clipped-scroll'
			overflowY: 'hidden'
		@timeHeadScroller.canvas = new ScrollerCanvas()
		@timeHeadScroller.render()
		@timeHeadScroller.el.appendTo(@timeHeadEl)

		@timeBodyScroller = new ClippedScroller()
		@timeBodyScroller.canvas = new ScrollerCanvas()
		@timeBodyScroller.render()
		@timeBodyScroller.el.appendTo(@timeBodyEl)

		@isTimeBodyScrolled = false # because if the grid has been rerendered, it will get a zero scroll
		@timeBodyScroller.on('scroll', proxy(this, 'handleTimeBodyScrolled'))

		@slatContainerEl = $('<div class="fc-slats"/>').appendTo(@timeBodyScroller.canvas.bgEl)
		@segContainerEl = $('<div class="fc-event-container"/>').appendTo(@timeBodyScroller.canvas.contentEl)
		@bgSegContainerEl = @timeBodyScroller.canvas.bgEl

		@timeBodyBoundCache = new CoordCache
			els: @timeBodyScroller.canvas.el # better representative of bounding box, considering annoying negative margins
			isHorizontal: true # we use the left/right for adjusting RTL coordinates
			isVertical: true

		@timeScrollJoiner = new ScrollJoiner('horizontal', [ @timeHeadScroller, @timeBodyScroller ])

		if true
			@headDateFollower = new ScrollFollower(@timeHeadScroller, true) # allowPointerEvents=true

		if true
			@eventTitleFollower = new ScrollFollower(@timeBodyScroller)
			@eventTitleFollower.minTravel = 50

			if @isRTL
				@eventTitleFollower.containOnNaturalRight = true
			else
				@eventTitleFollower.containOnNaturalLeft = true

		super


	renderSkeletonHtml: ->
		'<table>
			<thead class="fc-head">
				<tr>
					<td class="fc-time-area ' + @widgetHeaderClass + '"></td>
				</tr>
			</thead>
			<tbody class="fc-body">
				<tr>
					<td class="fc-time-area ' + @widgetContentClass + '"></td>
				</tr>
			</tbody>
		</table>'


	unrenderSkeleton: ->
		@handleTimeBodyScrolled(0)
		super


	# Date Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderDates: (dateProfile) ->
		@initScaleProps()

		@timeWindowMs = dateProfile.maxTime - dateProfile.minTime

		# makes sure zone is stripped
		@normalizedUnzonedStart = @normalizeGridDate(dateProfile.renderUnzonedRange.getStart())
		@normalizedUnzonedEnd = @normalizeGridDate(dateProfile.renderUnzonedRange.getEnd())

		# apply minTime/maxTime
		# TODO: move towards .time(), but didn't play well with negatives.
		# TODO: View should be responsible.
		if @isTimeScale
			@normalizedUnzonedStart.add(dateProfile.minTime)
			@normalizedUnzonedEnd.subtract(1, 'day').add(dateProfile.maxTime)

		@normalizedUnzonedRange = new UnzonedRange(@normalizedUnzonedStart, @normalizedUnzonedEnd)

		slotDates = []
		date = @normalizedUnzonedStart.clone()
		while date < @normalizedUnzonedEnd
			if @isValidDate(date)
				slotDates.push(date.clone())
			date.add(@slotDuration)

		@slotDates = slotDates
		@updateGridDates()

		slatHtmlRes = @renderSlatHtml()
		@timeHeadScroller.canvas.contentEl.html(slatHtmlRes.headHtml)
		@timeHeadColEls = @timeHeadScroller.canvas.contentEl.find('col')
		@slatContainerEl.html(slatHtmlRes.bodyHtml)
		@slatColEls = @slatContainerEl.find('col')
		@slatEls = @slatContainerEl.find('td')

		@slatCoordCache = new CoordCache
			els: @slatEls
			isHorizontal: true

		# for the inner divs within the slats
		# used for event rendering and scrollTime, to disregard slat border
		@slatInnerCoordCache = new CoordCache
			els: @slatEls.find('> div')
			isHorizontal: true
			# we use this coord cache for getPosition* for event rendering.
			# workaround for .fc-content's negative margins.
			offsetParent: @timeBodyScroller.canvas.el

		for date, i in @slotDates
			@publiclyTrigger('dayRender', {
				context: this
				args: [ date, @slatEls.eq(i), this ]
			})

		if @headDateFollower
			@headDateFollower.setSprites(@timeHeadEl.find('tr:not(:last-child) .fc-cell-text'))


	unrenderDates: ->
		if @headDateFollower
			@headDateFollower.clearSprites()

		@timeHeadScroller.canvas.contentEl.empty()
		@slatContainerEl.empty()

		# clear the widths,
		# for no jupiness when navigating
		@timeHeadScroller.canvas.clearWidth()
		@timeBodyScroller.canvas.clearWidth()


	renderSlatHtml: ->
		labelInterval = @labelInterval
		formats = @headerFormats
		cellRows = ([] for format in formats) # indexed by row,col
		leadingCell = null
		prevWeekNumber = null
		slotDates = @slotDates
		slotCells = [] # meta

		rowUnits =
			for format in formats
				FC.queryMostGranularFormatUnit(format)

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
					if !leadingCell or leadingCell.text != text
						newCell = @buildCellObject(date, text, rowUnits[row])
					else
						leadingCell.colspan += 1
				else
					if !leadingCell or isInt(divideRangeByDuration(@normalizedUnzonedStart, date, labelInterval))
						text = date.format(format)
						newCell = @buildCellObject(date, text, rowUnits[row])
					else
						leadingCell.colspan += 1

				if newCell
					newCell.weekStart = isWeekStart
					rowCells.push(newCell)

			slotCells.push({ weekStart: isWeekStart })
			prevWeekNumber = weekNumber

		isChrono = labelInterval > @slotDuration
		isSingleDay = @slotDuration.as('days') == 1

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

				headerCellClassNames = [ @widgetHeaderClass ]
				if cell.weekStart
					headerCellClassNames.push('fc-em-cell')
				if isSingleDay
					headerCellClassNames = headerCellClassNames.concat(
						@getDayClasses(cell.date, true) # adds "today" class and other day-based classes
					)

				html +=
					'<th class="' + headerCellClassNames.join(' ') + '"' +
						' data-date="' + cell.date.format() + '"' +
						(if cell.colspan > 1 then ' colspan="' + cell.colspan + '"' else '') +
					'>' +
						'<div class="fc-cell-content">' +
							cell.spanHtml +
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

		{ headHtml: html, bodyHtml: slatHtml }


	buildCellObject: (date, text, rowUnit) ->
		date = date.clone() # ensure our own reference
		spanHtml = @buildGotoAnchorHtml(
			{
				date
				type: rowUnit
				forceOff: not rowUnit
			},
			{
				'class': 'fc-cell-text'
			},
			htmlEscape(text)
		)
		{ text, spanHtml, date, colspan: 1 }


	slatCellHtml: (date, isEm) ->

		if @isTimeScale
			classes = []
			classes.push \
				if isInt(divideRangeByDuration(@normalizedUnzonedStart, date, @labelInterval))
					'fc-major'
				else
					'fc-minor'
		else
			classes = @getDayClasses(date)
			classes.push('fc-day')

		classes.unshift(@widgetContentClass)

		if isEm
			classes.push('fc-em-cell')

		'<td class="' + classes.join(' ') + '"' +
			' data-date="' + date.format() + '"' +
			'><div /></td>'


	# Event Rendering
	# ------------------------------------------------------------------------------------------------------------------


	executeEventRender: ->
		super
		@initEventTitleFollowers()


	initEventTitleFollowers: ->
		sprites = []
		for seg in @getEventSegs() # TODO: only retrieve fg segs
			titleEl = seg.el.find('.fc-title')
			if titleEl.length
				sprites.push(new ScrollFollowerSprite(titleEl))
		@eventTitleFollower.setSprites(sprites)


	executeEventUnrender: ->
		@eventTitleFollower.clearSprites()
		super


	# Business Hours
	# ------------------------------------------------------------------------------------------------------------------


	renderBusinessHours: (businessHourPayload) ->
		if not @largeUnit
			super


	# Now Indicator
	# ------------------------------------------------------------------------------------------------------------------


	getNowIndicatorUnit: ->
		# TODO: converge with largeUnit. precompute
		if @isTimeScale
			computeGreatestUnit(@slotDuration)


	# will only execute if isTimeScale
	renderNowIndicator: (date) ->
		nodes = []
		date = @normalizeGridDate(date)

		if @normalizedUnzonedRange.containsDate(date)
			coord = @dateToCoord(date)
			css = if @isRTL
					{ right: -coord }
				else
					{ left: coord }

			nodes.push($("<div class='fc-now-indicator fc-now-indicator-arrow'></div>")
				.css(css)
				.appendTo(@timeHeadScroller.canvas.el)[0])

			nodes.push($("<div class='fc-now-indicator fc-now-indicator-line'></div>")
				.css(css)
				.appendTo(@timeBodyScroller.canvas.el)[0])

		@nowIndicatorEls = $(nodes)


	# will only execute if isTimeScale
	unrenderNowIndicator: ->
		if @nowIndicatorEls
			@nowIndicatorEls.remove()
			@nowIndicatorEls = null


	# Sizing
	# ------------------------------------------------------------------------------------------------------------------


	updateSize: (totalHeight, isAuto, isResize) ->
		if isAuto
			bodyHeight = 'auto'
		else
			bodyHeight = totalHeight - @headHeight() - @queryMiscHeight()

		@timeBodyScroller.setHeight(bodyHeight)

		# reason for this complicated method is that things went wrong when:
		#  slots/headers didn't fill content area and needed to be stretched
		#  cells wouldn't align (rounding issues with available width calculated
		#  differently because of padding VS scrollbar trick)

		isDatesRendered = @timeHeadColEls # TODO: refactor use of this

		if isDatesRendered
			slotWidth = Math.round(@slotWidth or= @computeSlotWidth())
			containerWidth = slotWidth * @slotDates.length
			containerMinWidth = ''
			nonLastSlotWidth = slotWidth

			availableWidth = @timeBodyScroller.getClientWidth()
			if availableWidth > containerWidth
				containerMinWidth = availableWidth
				containerWidth = ''
				nonLastSlotWidth = Math.floor(availableWidth / @slotDates.length)
		else
			containerWidth = ''
			containerMinWidth = ''

		@timeHeadScroller.canvas.setWidth(containerWidth)
		@timeHeadScroller.canvas.setMinWidth(containerMinWidth)
		@timeBodyScroller.canvas.setWidth(containerWidth)
		@timeBodyScroller.canvas.setMinWidth(containerMinWidth)

		if isDatesRendered
			@timeHeadColEls.slice(0, -1).add(@slatColEls.slice(0, -1))
				.width(nonLastSlotWidth)

		@timeHeadScroller.updateSize()
		@timeBodyScroller.updateSize()
		@timeScrollJoiner.update()

		if isDatesRendered
			@buildCoords()

			# TODO: left/right CSS assignment also happens earlier in renderFgSegs
			@updateSegPositions()

			# this updateSize method is triggered by callers who don't always subsequently call updateNowIndicator,
			# and updateSize always has the risk of changing horizontal spacing which will affect nowIndicator positioning,
			# so always call it here too. will often rerender twice unfortunately.
			# TODO: more closely integrate updateSize with updateNowIndicator
			@updateNowIndicator()

		if @headDateFollower
			@headDateFollower.update()

		if @eventTitleFollower
			@eventTitleFollower.update()


	queryMiscHeight: ->
		@el.outerHeight() -
			@timeHeadScroller.el.outerHeight() -
			@timeBodyScroller.el.outerHeight()


	computeSlotWidth: -> # compute the *default*

		# TODO: harness core's `matchCellWidths` for this
		maxInnerWidth = 0
		innerEls = @timeHeadEl.find('tr:last-child th .fc-cell-text') # TODO: cache
		innerEls.each (i, node) ->
			innerWidth = $(node).outerWidth()
			maxInnerWidth = Math.max(maxInnerWidth, innerWidth)

		headerWidth = maxInnerWidth + 1 # assume no padding, and one pixel border
		slotsPerLabel = divideDurationByDuration(@labelInterval, @slotDuration) # TODO: rename labelDuration?
		slotWidth = Math.ceil(headerWidth / slotsPerLabel)

		minWidth = @timeHeadColEls.eq(0).css('min-width')
		if minWidth
			minWidth = parseInt(minWidth, 10)
			if minWidth
				slotWidth = Math.max(slotWidth, minWidth)

		slotWidth


	# Coordinates
	# ------------------------------------------------------------------------------------------------------------------


	buildCoords: ->
		@timeBodyBoundCache.build()
		@slatCoordCache.build()
		@slatInnerCoordCache.build()


	# returned value is between 0 and the number of snaps
	computeDateSnapCoverage: (date) ->
		snapDiff = divideRangeByDuration(@normalizedUnzonedStart, date, @snapDuration)

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
					@timeBodyBoundCache.getWidth(0)
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
		table = @timeHeadScroller.canvas.contentEl.find('table')
		table.height.apply(table, arguments)


	# this needs to be called if v scrollbars appear on body container. or zooming
	updateSegPositions: ->
		segs = [].concat(
			@getEventSegs()
			@getBusinessHourSegs()
		)

		for seg in segs
			coords = @rangeToCoords(seg)
			seg.el.css
				left: (seg.left = coords.left)
				right: -(seg.right = coords.right)
		return


	# Scrolling
	# ---------------------------------------------------------------------------------


	handleTimeBodyScrolled: (top, left) ->
		if top
			if not @isTimeBodyScrolled
				@isTimeBodyScrolled = true
				@el.addClass('fc-scrolled')
		else
			if @isTimeBodyScrolled
				@isTimeBodyScrolled = false
				@el.removeClass('fc-scrolled')


	computeInitialDateScroll: ->
		unzonedRange = @get('dateProfile').activeUnzonedRange
		left = 0
		if @isTimeScale
			scrollTime = @opt('scrollTime')
			if scrollTime
				scrollTime = moment.duration(scrollTime)
				left = @dateToCoord(unzonedRange.getStart().time(scrollTime)) # TODO: fix this for RTL
		{ left }


	queryDateScroll: ->
		{ left: @timeBodyScroller.getScrollLeft() }


	applyDateScroll: (scroll) ->
		if scroll.left?
			# TODO: workaround for FF. the ScrollJoiner sibling won't react fast enough
			# to override the native initial crappy scroll that FF applies.
			# TODO: have the ScrollJoiner handle this
			# Similar code in ResourceTimelineView::setScroll
			@timeHeadScroller.setScrollLeft(scroll.left)
			@timeBodyScroller.setScrollLeft(scroll.left)


	# Hit System
	# ------------------------------------------------------------------------------------------------------------------


	prepareHits: ->
		@buildCoords()


	# FYI: we don't want to clear the slatCoordCache in releaseHits()
	# because those coordinates are needed for dateToCoord()


	queryHit: (leftOffset, topOffset) ->
		snapsPerSlot = @snapsPerSlot
		slatCoordCache = @slatCoordCache
		timeBodyBoundCache = @timeBodyBoundCache

		# within scroll container's content rectangle?
		if timeBodyBoundCache.isPointInBounds(leftOffset, topOffset)

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
					top: timeBodyBoundCache.getTopOffset(0),
					bottom: timeBodyBoundCache.getBottomOffset(0)
				}


	getHitFootprint: (hit) ->
		new ComponentFootprint(
			@getSnapUnzonedRange(hit.snap)
			not @isTimeScale # isAllDay
		)


	getHitEl: (hit) ->
		@getSnapEl(hit.snap) # TODO: write a test for this


	###
	TODO: avoid using moments
	###
	getSnapUnzonedRange: (snapIndex) ->
		start = @normalizedUnzonedStart.clone()
		start.add(multiplyDuration(@snapDuration, @snapIndexToDiff[snapIndex]))
		end = start.clone().add(@snapDuration)
		new UnzonedRange(start, end)


	getSnapEl: (snapIndex) ->
		@slatEls.eq(Math.floor(snapIndex / @snapsPerSlot))


	# Event Resizing
	# ------------------------------------------------------------------------------------------------------------------


	# Renders a visual indication of an event being resized
	renderEventResize: (eventFootprints, seg, isTouch) ->
		for eventFootprint in eventFootprints
			@renderHighlight(eventFootprint.componentFootprint)

		@helperRenderer.renderEventResizingFootprints(eventFootprints, seg, isTouch)


	# Unrenders a visual indication of an event being resized
	unrenderEventResize: ->
		@unrenderHighlight()
		@helperRenderer.unrender()


	# DnD
	# ------------------------------------------------------------------------------------------------------------------


	# TODO: different technique based on scale.
	#  when dragging, middle of event is the drop.
	#  should be the edges when isTimeScale.
	renderDrag: (eventFootprints, seg, isTouch) ->
		if seg
			@helperRenderer.renderEventDraggingFootprints(eventFootprints, seg, isTouch)
			true # signal helper rendered
		else
			for eventFootprint in eventFootprints
				@renderHighlight(eventFootprint.componentFootprint)
			false # signal helper not rendered


	unrenderDrag: ->
		@helperRenderer.unrender()
		@unrenderHighlight()
