
class ResourceTimelineGrid extends TimelineGrid

	@mixin ResourceGridMixin

	eventRows: null
	shownEventRows: null
	tbodyEl: null
	rowCoordCache: null


	###
	footprint is a ResourceComponentFootprint
	###
	componentFootprintToSegs: (footprint) ->
		segs = super
		calendar = @view.calendar
		resourceId = footprint.resourceId

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


	getHitFootprint: (hit) ->
		componentFootprint = super
		new ResourceComponentFootprint(
			componentFootprint.unzonedRange
			componentFootprint.isAllDay
			hit.resourceId
		)


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


	unrenderBgSegs: ->
		super

		eventRows = @view.getEventRows() # need to freshly query. grid might not be built

		# TODO: consolidate with what EventRow does
		# TODO: triggerEventUnrender
		for eventRow in eventRows
			eventRow.bgSegs = null


	# Business Hours
	# ---------------------------------------------------------------------------------
	# all of the below `row`s are assumed to be *RESOURCE* rows

	# a running count of rows that define their own business hour rules
	rowCntWithCustomBusinessHours: 0

	renderBusinessHours: ->
		if @rowCntWithCustomBusinessHours # need to render individual?
			@ensureIndividualBusinessHours()
		else
			super

	unrenderBusinessHours: ->
		if @rowCntWithCustomBusinessHours # need to unrender individual?
			@clearIndividualBusinessHours()
		else
			super

	###
	Ensures that all rows have their individual business hours DISPLAYED.
	###
	ensureIndividualBusinessHours: ->
		for row in @view.getEventRows()

			if @view.has('dateProfile') and not row.businessHourSegs
				@populateRowBusinessHoursSegs(row)

			if row.isShown
				row.ensureBusinessHourSegsRendered()

	###
	Ensures that all rows have their individual business hours CLEARED.
	###
	clearIndividualBusinessHours: ->
		for row in @view.getEventRows()
			row.clearBusinessHourSegs() # sets row.businessHourSegs to null

	###
	Called when a row has been added to the tree data structure, but before it's rendered.
	Computes and assigns business hour data *if necessary*. To be rendered soon after.
	###
	assignRowBusinessHourSegs: (row) ->
		if row.resource.businessHours

			# was previously rendering general business hour,
			# but now needs to render per-resource business hours for every resource?
			if not @rowCntWithCustomBusinessHours
				TimelineGrid::unrenderBusinessHours.call(this) # unrender general
				@ensureIndividualBusinessHours() # render per-resource

			@rowCntWithCustomBusinessHours += 1

		if @view.has('dateProfile') and @rowCntWithCustomBusinessHours
			# will need for render later, regardless of whether row defines its own custom rules
			@populateRowBusinessHoursSegs(row)

	###
	Called when a row has been removed from the tree data structure.
	Unrenders the row's segs and, if necessary, forces businessHours back to generic rendering.
	###
	destroyRowBusinessHourSegs: (row) ->
		row.clearBusinessHourSegs() # sets row.businessHourSegs to null

		if row.resource.businessHours
			@rowCntWithCustomBusinessHours -= 1

			if not @rowCntWithCustomBusinessHours
				@clearIndividualBusinessHours() # unrender individual
				TimelineGrid::renderBusinessHours.call(this) # render general

	###
	Compute and assign to row.businessHourSegs unconditionally
	###
	populateRowBusinessHoursSegs: (row) ->
		businessHours = row.resource.businessHours or @view.opt('businessHours')
		businessHoursEvents = @view.calendar.computeBusinessHourEvents(not @isTimeScale, businessHours)
		businessHourSegs = @eventsToSegs(businessHoursEvents)
		businessHourSegs = @renderFillSegEls('businessHours', businessHourSegs) # pass in className? # always needs this because EventRow doesnt do it
		row.businessHourSegs = businessHourSegs
		return


	# Fill System
	# ---------------------------------------------------------------------------------


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
