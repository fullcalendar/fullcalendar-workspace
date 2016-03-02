
class ResourceTimelineGrid extends TimelineGrid

	@mixin ResourceGridMixin

	eventRows: null
	shownEventRows: null
	tbodyEl: null
	rowCoordCache: null


	spanToSegs: (span) ->
		segs = super
		calendar = @view.calendar
		resourceId = span.resourceId

		if resourceId
			for seg in segs
				# TODO: pick a technique
				seg.resource = calendar.getResourceById(resourceId)
				seg.resourceId = resourceId

		segs


	prepareHits: ->
		super

		@eventRows = @view.getEventRows()
		@shownEventRows = (row for row in @eventRows when row.isShown)

		trArray =
			for row in @shownEventRows
				row.getTr('event')[0]

		@rowCoordCache = new CoordCache
			els: trArray
			isVertical: true
		@rowCoordCache.build()


	releaseHits: ->
		super
		@eventRows = null
		@shownEventRows = null
		@rowCoordCache.clear()


	queryHit: (leftOffset, topOffset) ->
		simpleHit = super
		if simpleHit
			rowIndex = @rowCoordCache.getVerticalIndex(topOffset)
			if rowIndex?
				{
					resourceId: @shownEventRows[rowIndex].resource.id
					snap: simpleHit.snap
					component: this # need this unfortunately :(
					left: simpleHit.left
					right: simpleHit.right
					top: @rowCoordCache.getTopOffset(rowIndex)
					bottom: @rowCoordCache.getBottomOffset(rowIndex)
				}


	getHitSpan: (hit) ->
		span = @getSnapRange(hit.snap)
		span.resourceId = hit.resourceId
		span


	getHitEl: (hit) ->
		@getSnapEl(hit.snap)


	renderSkeleton: ->
		super

		# only non-resource grid needs this, so kill it
		# TODO: look into better solution
		@segContainerEl.remove()
		@segContainerEl = null

		rowContainerEl = $('<div class="fc-rows"><table><tbody/></table></div>').appendTo(@bodyScroller.canvas.contentEl)
		@tbodyEl = rowContainerEl.find('tbody')


	renderFgSegs: (segs) -> # TODO: make DRY-er
		segs = @renderFgSegEls(segs)
		pairs = @view.pairSegsWithRows(segs)

		visiblePairs = []
		for pair in pairs
			[ containerObj, containerSegs ] = pair
			containerObj.fgSegs = containerSegs

			if containerObj.isShown
				containerObj.isSegsRendered = true
				visiblePairs.push(pair)

		@renderFgSegsInContainers(visiblePairs)
		@updateSegFollowers(segs)

		segs


	unrenderFgSegs: ->
		@clearSegFollowers()
		eventRows = @view.getEventRows() # need to freshly query. grid might not be built

		# TODO: consolidate with what EventRow does
		# TODO: triggerEventUnrender
		for eventRow in eventRows
			eventRow.fgSegs = null
			eventRow.isSegsRendered = false

		@unrenderFgContainers(eventRows)


	renderFill: (type, segs, className) ->
		segs = @renderFillSegEls(type, segs)
		resourceSegs = []
		nonResourceSegs = []

		for seg in segs
			if seg.resourceId
				resourceSegs.push(seg)
			else
				nonResourceSegs.push(seg)

		pairs = @view.pairSegsWithRows(resourceSegs)
		visiblePairs = []

		for pair in pairs
			[ rowObj, rowSegs ] = pair

			if type == 'bgEvent'
				rowObj.bgSegs = rowSegs

			if rowObj.isShown
				visiblePairs.push(pair)

		if nonResourceSegs.length
			visiblePairs.unshift([ this, nonResourceSegs ])

		@renderFillInContainers(type, visiblePairs, className)

		segs


	# TODO: when unrendering fill, update rowObj's bgSegs


	renderHelper: (event, sourceSeg) ->
		segs = @eventToSegs(event) # repeat :(
		segs = @renderFgSegEls(segs)
		pairs = @view.pairSegsWithRows(segs)
		@renderHelperSegsInContainers(pairs, sourceSeg)


	# Scrolling
	# ---------------------------------------------------------------------------------
	# this is useful for scrolling prev/next dates while resource is scrolled down


	computeInitialScroll: (prevState) ->
		state = super
		if prevState
			state.resourceId = prevState.resourceId
			state.bottom = prevState.bottom
		state


	queryScroll: ->
		state = super

		scrollerTop = @bodyScroller.scrollEl.offset().top # TODO: use getClientRect

		for rowObj in @view.getVisibleRows()
			if rowObj.resource
				el = rowObj.getTr('event')
				elBottom = el.offset().top + el.outerHeight()

				if elBottom > scrollerTop
					state.resourceId = rowObj.resource.id
					state.bottom = elBottom - scrollerTop
					break
		state


	setScroll: (state) ->
		if state.resourceId
			row = @view.getResourceRow(state.resourceId)
			if row
				el = row.getTr('event')
				if el
					innerTop = @bodyScroller.canvas.el.offset().top # TODO: use -scrollHeight or something
					elBottom = el.offset().top + el.outerHeight()
					state.top = elBottom - state.bottom - innerTop
		super(state)


	scrollToResource: (resource) -> # consolidate with above?
		row = @view.getResourceRow(resource.id)
		if row
			el = row.getTr('event')
			if el
				innerTop = @bodyScroller.canvas.el.offset().top # TODO: use -scrollHeight or something
				scrollTop = el.offset().top - innerTop
				@bodyScroller.scrollEl.scrollTop(scrollTop) # TODO: better API

