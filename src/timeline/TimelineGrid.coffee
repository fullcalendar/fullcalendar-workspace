
cssToStr = FC.cssToStr


class TimelineGrid extends Grid

	slotDates: null

	headEl: null
	slatContainerEl: null
	slatEls: null # in DOM order

	slatElCoords: null # ordered by slotDate

	headScroller: null
	bodyScroller: null
	joiner: null
	follower: null
	eventTitleFollower: null

	minTime: null
	maxTime: null
	slotDuration: null # TODO: move View's setting into here
	snapDuration: null # TODO: rename cellDuration???

	slotCnt: null
	snapDiffToCol: null
	colToSnapDiff: null
	colsPerSlot: null

	duration: null
	labelInterval: null
	headerFormats: null
	isTimeScale: null

	emphasizeWeeks: false

	titleFollower: null

	segContainerEl: null
	segContainerHeight: null

	bgSegContainerEl: null # TODO: populate

	helperEls: null

	innerEl: null



	constructor: ->
		super

		@initScaleProps()

		# TODO: more formal option system. works with Agenda
		@minTime = moment.duration(@opt('minTime') || '00:00')
		@maxTime = moment.duration(@opt('maxTime') || '24:00')

		@snapDuration =
			if (input = @opt('snapDuration'))
				moment.duration(input)
			else
				@slotDuration

		@cellDuration = @snapDuration # for Grid

		@colsPerSlot = divideDurationByDuration(@slotDuration, @snapDuration)
			# TODO: do this in initScaleProps?

		@slotWidth = @opt('slotWidth')


	# TODO: do this for other grids
	opt: (name) ->
		@view.opt(name)


	isValidDate: (date) ->
		if @view.isHiddenDay(date)
			false
		else if @isTimeScale
			time = date.time()
			time >= @minTime and time < @maxTime
		else
			true


	computeDisplayEventTime: ->
		not @isTimeScale # because times should be obvious via axis


	computeDisplayEventEnd: ->
		false


	# Computes a default event time formatting string if `timeFormat` is not explicitly defined
	computeEventTimeFormat: ->
		#@opt('noMeridiemTimeFormat') # like "6:30" (no AM/PM)
		@opt('extraSmallTimeFormat')


	# Cell System
	# ---------------------------------------------------------------------------------


	normalizeGridDate: (date) -> # returns new copy. "normalizeRangeDate"?
		if @isTimeScale
			@view.calendar.rezoneDate(date) # always do this?
		else if @largeUnit
			date.clone().startOf(@largeUnit)
		else
			date.clone().stripTime()


	rangeUpdated: ->
		@start = @normalizeGridDate(@start)
		@end = @normalizeGridDate(@end)

		slotDates = []
		date = @start.clone()
		while date < @end
			if @isValidDate(date)
				slotDates.push(date.clone())
			date.add(@slotDuration)

		@slotDates = slotDates
		@updateGridDates()


	updateGridDates: -> # TODO: rename :(
		col = -1
		snapIndex = 0
		snapDiffToCol = []
		colToSnapDiff = []

		date = @start.clone()
		while date < @end
			if @isValidDate(date)
				col++
				snapDiffToCol.push(col)
				colToSnapDiff.push(snapIndex)
			else
				snapDiffToCol.push(col + 0.5)
			date.add(@snapDuration)
			snapIndex++

		@snapDiffToCol = snapDiffToCol
		@colToSnapDiff = colToSnapDiff
		@colCnt = col + 1 # NOTE: since this is trailing


	build: -> # build the grid
		@rowCnt = 1


	getRowEl: ->
		@bodyScroller.contentEl


	getCellDayEl: (cell) ->
		@slatEls.eq(Math.floor(cell.col / @colsPerSlot))


	computeColCoords: ->
		coords = []
		date = @start.clone()
		while date < @end
			if @isValidDate(date)
				coords.push(@rangeToOffsets({
					start: date,
					end: date.clone().add(@snapDuration)
				}))
			date.add(@snapDuration)
		coords


	computeCellRange: (cell) -> # TODO: use computeCellDate instead. make sure to return a clone from it
		start = @start.clone()
		start.add(multiplyDuration(@snapDuration, @colToSnapDiff[cell.col]))
		end = start.clone().add(@snapDuration)
		{ start, end }



	# TODO: don't show business hours if a large scale!!!


	rangeToSegs: (range) ->

		if @isTimeScale
			normalizedRange = range
		else
			normalizedRange = @view.computeDayRange(range)

			if @largeUnit
				newStart = normalizedRange.start.clone().startOf(@largeUnit)
				newEnd = normalizedRange.end.clone().startOf(@largeUnit)

				if not newEnd.isSame(normalizedRange.end) or not newEnd.isAfter(newStart)
					newEnd.add(@slotDuration)

				normalizedRange = { start: newStart, end: newEnd }

		seg = intersectionToSeg(normalizedRange, @view) # todo: what about normalizing timezone?

		# TODO: what if month slots? should round it to nearest month
		# TODO: dragging/resizing in this situation? deltas for dragging/resizing breaks down

		if seg

			if seg.isStart and not @isValidDate(seg.start)
				seg.isStart = false

			if seg.isEnd and seg.end and not @isValidDate(seg.end.clone().subtract(1))
				seg.isEnd = false

			[ seg ]
		else
			[]


	# Main Rendering
	# ---------------------------------------------------------------------------------


	renderSkeleton: ->

		@headScroller = new Scroller('invisible-scroll', 'hidden')
		@headEl.append(@headScroller.el)

		@bodyScroller = new Scroller()
		@el.append(@bodyScroller.el)

		@innerEl = @bodyScroller.contentEl # temporary

		@slatContainerEl = $('<div class="fc-slats"/>').appendTo(@bodyScroller.bgEl)
		@segContainerEl = $('<div class="fc-event-container"/>').appendTo(@bodyScroller.contentEl) # I DONT LIKE all the css that goes with fc-event-container
		@bgSegContainerEl = @bodyScroller.bgEl

		@coordMap.containerEl = @bodyScroller.scrollEl

		@joiner = new ScrollJoiner('horizontal', [ @headScroller, @bodyScroller ])

		if true
			@follower = new ScrollFollower(@headScroller)

		if true
			@eventTitleFollower = new ScrollFollower(@bodyScroller)
			@eventTitleFollower.minTravel = 50
			if @isRTL
				@eventTitleFollower.containOnNaturalRight = true
			else
				@eventTitleFollower.containOnNaturalLeft = true

		super


	headColEls: null
	slatColEls: null


	renderDates: ->
		@headScroller.contentEl.html(@renderHeadHtml())
		@headColEls = @headScroller.contentEl.find('col')
		@slatContainerEl.html(@renderSlatHtml())
		@slatColEls = @slatContainerEl.find('col')
		@slatEls = @slatContainerEl.find('td')

		for date, i in @slotDates
			@view.trigger('dayRender', null, date, @slatEls.eq(i))

		if @follower
			@follower.setSprites(@headEl.find('tr:not(:last-child) span'))


	unrenderDates: ->
		if @follower
			@follower.clearSprites()

		@headScroller.contentEl.empty()
		@slatContainerEl.empty()

		# clear the width!
		# for no jupiness when navigating
		# TODO: more modular
		@headScroller.contentEl.add(@bodyScroller.contentEl).css
			minWidth: ''
			width: ''


	renderHeadHtml: -> # misnamed
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
					if !leadingCell or leadingCell.text != text
						newCell = { text, colspan: 1 }
					else
						leadingCell.colspan += 1
				else
					if !leadingCell or isInt(divideRangeByDuration(@start, date, labelInterval))
						text = date.format(format)
						newCell = { text, colspan: 1 }
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
				html += '<th class="' +
						@view.widgetHeaderClass + ' ' +
						(if cell.weekStart then 'fc-em-cell' else '') +
						'"' +
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
		@_slatHtml


	slatCellHtml: (date, isEm) ->

		if @isTimeScale
			classes = []
			classes.push \
				if (date - @start) % @labelInterval is 0
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


	businessHourSegs: null


	renderBusinessHours: ->
		if not @largeUnit
			events = @view.calendar.getBusinessHoursEvents(not @isTimeScale)
			segs = @businessHourSegs = @eventsToSegs(events)
			@renderFill('businessHours', segs, 'bgevent')


	unrenderBusinessHours: ->
		@unrenderFill('businessHours')


	# Coordinates
	# ---------------------------------------------------------------------------------

	explicitSlotWidth: null
	defaultSlotWidth: null


	updateWidth: -> # TODO: call super?

		# reason for this complicated method is that thing went wrong when:
		#  slots/headers didn't fill content area and needed to be stretched
		#  cells wouldn't align (rounding issues with available width calculated
		#  differently because of padding VS scrollbar trick)

		slotWidth = Math.round(@slotWidth or= @computeSlotWidth())
		containerWidth = slotWidth * @slotDates.length
		containerMinWidth = ''
		nonLastSlotWidth = slotWidth

		availableWidth = @bodyScroller.scrollEl[0].clientWidth # util!?
		if availableWidth > containerWidth
			containerMinWidth = availableWidth
			containerWidth = ''
			nonLastSlotWidth = Math.floor(availableWidth / @slotDates.length)

		@headScroller.setContentWidth(containerWidth)
		@headScroller.setContentMinWidth(containerMinWidth)
		@bodyScroller.setContentWidth(containerWidth)
		@bodyScroller.setContentMinWidth(containerMinWidth)

		@headColEls.slice(0, -1).add(@slatColEls.slice(0, -1))
			.width(nonLastSlotWidth)

		@headScroller.update()
		@bodyScroller.update()
		@joiner.update()

		@updateSlatElCoords()
		@updateSegPositions()

		if @follower
			@follower.update()

		if @eventTitleFollower
			@eventTitleFollower.update() # do this here too?


	computeSlotWidth: -> # compute the *default*

		# TODO: harness common's `matchCellWidths` for this
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


	# absolute distance from origin
	updateSlatElCoords: ->
		divs = @slatEls.find('> div')

		# TODO: negative margins !?
		originEl = @bodyScroller.innerEl

		if @isRTL
			origin = originEl.offset().left + originEl.outerWidth() # TODO: cache
			coords = for slatEl, i in divs
				$(slatEl).offset().left + $(slatEl).outerWidth() - origin
			coords[i] = $(slatEl).offset().left - origin
		else
			origin = originEl.offset().left
			coords = for slatEl, i in divs
				$(slatEl).offset().left - origin
			coords[i] = $(slatEl).offset().left + $(slatEl).outerWidth() - origin

		@slatElCoords = coords # has one more than we need. yayy!!!!!


	dateToCol: (date) -> # might return in-between values!!!
		snapDiff = divideRangeByDuration(@start, date, @snapDuration)
		if snapDiff < 0
			0
		else if snapDiff >= @snapDiffToCol.length
			@colCnt
		else
			snapDiffInt = Math.floor(snapDiff)
			snapDiffRemainder = snapDiff - snapDiffInt

			col = @snapDiffToCol[snapDiffInt]
			if isInt(col) and snapDiffRemainder
				col += snapDiffRemainder

			col


	dateToCoord: (date) ->
		col = @dateToCol(date)
		slotIndex = col / @colsPerSlot # TODO: test where there might be overflow

		slotIndex = Math.max(slotIndex, 0)
		slotIndex = Math.min(slotIndex, @slotDates.length)

		if isInt(slotIndex)
			@slatElCoords[slotIndex]
		else
			index0 = Math.floor(slotIndex)
			ms0 = +@slotDates[index0]
			ms1 = +@slotDates[index0].clone().add(@slotDuration)
			partial = (date - ms0) / (ms1 - ms0)
			partial = Math.min(partial, 1) # when in between the minTimes/maxTimes
			coord0 = @slatElCoords[index0]
			coord1 = @slatElCoords[index0 + 1]
			coord0 + (coord1 - coord0) * partial


	rangeToCoords: (range) -> # endDiff was killed!
		if @isRTL
			{ right: @dateToCoord(range.start), left: @dateToCoord(range.end) }
		else
			{ left: @dateToCoord(range.start), right: @dateToCoord(range.end) }


	rangeToOffsets: (range) ->
		coords = @rangeToCoords(range)
		origin = if @isRTL
				@slatContainerEl.offset().left + @slatContainerEl.outerWidth() # TODO: cache
			else
				@slatContainerEl.offset().left
		coords.left += origin
		coords.right += origin
		coords


	headHeight: -> # TODO: route this better
		table = @headScroller.contentEl.find('table')
		table.height.apply(table, arguments)


	updateSegPositions: ->
		segs = (@segs or []).concat(@businessHourSegs or [])

		for seg in segs
			coords = @rangeToCoords(seg, -1)
			seg.el.css
				left: (seg.left = coords.left)
				right: -(seg.right = coords.right)
		return

		# needs this if v scrollbars appear on body container. or zooming

		# do we even need to position the segs in the first place if this always gets called after?


	# Scrolling
	# ---------------------------------------------------------------------------------


	computeInitialScroll: (prevState) ->
		left = 0
		if @isTimeScale
			scrollTime = @opt('scrollTime')
			if scrollTime
				scrollTime = moment.duration(scrollTime)
				left = @dateToCoord(@start.clone().time(scrollTime))
		{ left, top: 0 }


	queryScroll: ->
		{
			left: normalizedHScroll(@bodyScroller.scrollEl)
			top: @bodyScroller.scrollEl.scrollTop()
		}


	setScroll: (state) ->
		normalizedHScroll(@bodyScroller.scrollEl, state.left)
		@bodyScroller.scrollEl.scrollTop(state.top)


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
				# TODO: centralize logic
				coords = @rangeToCoords(seg, -1)
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
			buildSegLevels(segs)
			container.segContainerHeight = computeOffsetForSegs(segs) # returns this value!

		# assign seg verticals
		for [ container, segs ] in pairs
			for seg in segs
				seg.el.css('top', seg.top)
			container.segContainerEl.height(container.segContainerHeight)


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

		timeText = @getEventTimeText(seg.event)

		'<div class="' + classes.join(' ') + '" style="' + cssToStr(@getEventSkinCss(seg.event)) + '">' +
			'<div class="fc-content">' +
				(if timeText
					'<span class="fc-time">' +
						htmlEscape(timeText) +
					'</span>'
				else
					'') +
				'<span class="fc-title">' +
					htmlEscape(seg.event.title || '') +
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
		'</div>'


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
		segs = @eventsToSegs([ event ])
		segs = @renderFgSegEls(segs)
		@renderHelperSegsInContainers([[ this, segs ]], sourceSeg)


	renderHelperSegsInContainers: (pairs, sourceSeg) ->
		helperNodes = []

		for [ containerObj, segs ] in pairs
			for seg in segs

				# TODO: centralize logic
				coords = @rangeToCoords(seg, -1)
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

				# FYI: containerObj is either the Grid or a ResourceRow

				if sourceSeg and sourceSeg.resourceId == containerObj.resource?.id # DETANGLE !!!!!!!???????? but will work for now
					seg.el.css('top', sourceSeg.el.css('top'))
				else
					seg.el.css('top', 0)

		for [ containerObj, segs ] in pairs

			helperContainerEl = $('<div class="fc-event-container fc-helper-container"/>')
				.appendTo(containerObj.innerEl)

			helperNodes.push(helperContainerEl[0])

			for seg in segs
				helperContainerEl.append(seg.el)

		if (@helperEls)
			@helperEls = @helperEls.add($(helperNodes))
		else
			@helperEls = $(helperNodes)


	unrenderHelper: ->
		if @helperEls
			@helperEls.remove()
			@helperEls = null


	# Renders a visual indication of an event being resized
	renderEventResize: (range, seg) ->
		@renderHighlight(@eventRangeToSegs(range))
		@renderRangeHelper(range, seg) # TODO: make this a default in Grid


	# Unrenders a visual indication of an event being resized
	unrenderEventResize: ->
		@unrenderHighlight()
		@unrenderHelper() # TODO: make this a default in Grid


	# Fill
	# ---------------------------------------------------------------------------------

	#
	# BUG with rendering background fills over foreground
	#

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
				coords = @rangeToCoords(seg, -1) # TODO: centralize logic
				seg.el.css
					left: (seg.left = coords.left)
					right: -(seg.right = coords.right)

				seg.el.appendTo(containerEl)

			# yuck!!!
			# TODO: better API
			if @elsByFill[type]
				@elsByFill[type] = @elsByFill[type].add(containerEl)
			else
				@elsByFill[type] = containerEl


	# DnD
	# ---------------------------------------------------------------------------------


	renderDrag: (dropLocation, seg) -> # TODO: different technique based on scale
		if seg
			# TODO: don't do this when @isTimeScale
			# but we have to make really wide event dragfollowers work better

			@renderRangeHelper(dropLocation, seg)
			@applyDragOpacity(@helperEls)
			true
		else
			@renderHighlight(@eventRangeToSegs(dropLocation))
			false


	unrenderDrag: ->
		@unrenderHelper()
		@unrenderHighlight()


durationHasTime = FC.durationHasTime


divideRangeByDuration = (start, end, dur) ->
	if durationHasTime(dur)
		(end - start) / dur
	else
		months = dur.asMonths()
		if Math.abs(months) >= 1 and isInt(months)
			end.diff(start, 'months', true) / months
		else
			end.diff(start, 'days', true) / dur.asDays()


divideDurationByDuration = (dur1, dur2) ->
	if durationHasTime(dur1) or durationHasTime(dur2)
		dur1 / dur2
	else
		months1 = dur1.asMonths()
		months2 = dur2.asMonths()
		if Math.abs(months1) >= 1 and isInt(months1) and \
		   Math.abs(months2) >= 1 and isInt(months2)
			months1 / months2
		else
			dur1.asDays() / dur2.asDays()


multiplyDuration = (dur, n) ->
	if durationHasTime(dur)
		moment.duration(dur * n)
	else
		months = dur.asMonths()
		if Math.abs(months) >= 1 and isInt(months)
			moment.duration({ months: months * n })
		else
			moment.duration({ days: dur.asDays() * n })


# TODO: see how these utils related to the interval utils in util.js





# Seg Rendering Utils
# ----------------------------------------------------------------------------------------------------------------------
# TODO: move


# NOTE: modified segs
buildSegLevels = (segs) ->
	segLevels = []

	segs.sort(compareSegs)

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
