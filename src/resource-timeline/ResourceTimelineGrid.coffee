
class ResourceTimelineGrid extends TimelineGrid

	@mixin ResourceInteractionsMixin

	# doesn't do its own event rendering. defers to rows.
	eventRendererClass: null

	eventRows: null
	shownEventRows: null
	tbodyEl: null
	rowCoordCache: null


	setEventsInChildren: ->
		# ResourceTimelineView is responsible for this


	unsetEventsInChildren: ->
		# ResourceTimelineView is responsible for this


	setBusinessHoursInChildren: ->
		# ResourceTimelineView is responsible for this


	unsetBusinessHoursInChildren: ->
		# ResourceTimelineView is responsible for this


	setResourcesInChildren: ->
		# ResourceTimelineView is responsible for this


	unsetResourcesInChildren: ->
		# ResourceTimelineView is responsible for this


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
