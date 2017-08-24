
class ResourceTimelineGrid extends TimelineGrid

	# configuration for DateComponent monkeypatch
	isResourceFootprintsEnabled: true

	# renders non-resource bg events only
	eventRendererClass: ResourceTimelineGridEventRenderer

	eventRows: null
	shownEventRows: null
	tbodyEl: null
	rowCoordCache: null

	customBizGenCnt: 0
	fallbackBizGenForRows: null


	###
	Assumes ResourceTimelineGrid's own businessHourGenerator is set first
	TODO: better system?
	###
	addChild: (rowObj) ->
		if rowObj.resource.businessHourGenerator # custom generator?
			rowObj.set('businessHourGenerator', rowObj.resource.businessHourGenerator)

			if (++@customBizGenCnt) == 1 # first row with a custom generator?

				# store existing general business hour generator
				if @has('businessHourGenerator')
					@fallbackBizGenForRows = @get('businessHourGenerator')
					@unset('businessHourGenerator')

					# apply to previously added rows without their own generator
					for otherRowObj in @view.getEventRows() # does not include rowObj
						if not otherRowObj.has('businessHourGenerator')
							otherRowObj.set('businessHourGenerator', @fallbackBizGenForRows)
		else
			if @fallbackBizGenForRows
				rowObj.set('businessHourGenerator', @fallbackBizGenForRows)

		super # add rowObj


	###
	Assumes ResourceTimelineGrid's own businessHourGenerator is set first
	TODO: better system?
	###
	removeChild: (rowObj) ->
		super # remove rowObj

		if rowObj.resource.businessHourGenerator # had custom generator?

			if (--@customBizGenCnt) == 0 # no more custom generators?

				# reinstall previous general business hour generator
				if @fallbackBizGenForRows

					for otherRowObj in @view.getEventRows() # does not include rowObj
						if not otherRowObj.resource.businessHourGenerator # doesn't have custom def
							otherRowObj.unset('businessHourGenerator')

					@set('businessHourGenerator', @fallbackBizGenForRows)
					@fallbackBizGenForRows = null

		# remove the row's generator, regardless of how it was received
		rowObj.unset('businessHourGenerator')


	setBusinessHourGeneratorInChild: (businessHourGenerator, child) ->
		# happens in addChild


	unsetBusinessHourGeneratorInChild: (child) ->
		# happens in removeChild


	setEventDataSourceInChildren: ->
		# ResourceRow is responsible


	unsetEventDataSourceInChildren: ->
		# ResourceRow is responsible


	renderSelectionFootprint: (componentFootprint) ->
		if componentFootprint.resourceId
			rowObj = @view.getResourceRow(componentFootprint.resourceId)
			if rowObj
				rowObj.renderSelectionFootprint(componentFootprint)
		else
			super


	renderSkeleton: ->
		super

		# only non-resource grid needs this, so kill it
		# TODO: look into better solution
		@segContainerEl.remove()
		@segContainerEl = null

		rowContainerEl = $('<div class="fc-rows"><table><tbody/></table></div>').appendTo(@bodyScroller.canvas.contentEl)
		@tbodyEl = rowContainerEl.find('tbody')


	# Event Resizing (route to rows)
	# ---------------------------------------------------------------------------------


	renderEventResize: (eventFootprints, seg, isTouch) ->
		map = groupEventFootprintsByResourceId(eventFootprints)

		for resourceId, resourceEventFootprints of map
			rowObj = @view.getResourceRow(resourceId)

			# render helpers
			rowObj.helperRenderer.renderEventDraggingFootprints(resourceEventFootprints, seg, isTouch)

			# render highlight
			for eventFootprint in resourceEventFootprints
				rowObj.renderHighlight(eventFootprint.componentFootprint)


	unrenderEventResize: ->
		for rowObj in @view.getEventRows()
			rowObj.helperRenderer.unrender()
			rowObj.unrenderHighlight()


	# DnD (route to rows)
	# ---------------------------------------------------------------------------------


	renderDrag: (eventFootprints, seg, isTouch) ->
		map = groupEventFootprintsByResourceId(eventFootprints)

		if seg
			# draw helper
			for resourceId, resourceEventFootprints of map
				rowObj = @view.getResourceRow(resourceId)
				rowObj.helperRenderer.renderEventDraggingFootprints(resourceEventFootprints, seg, isTouch)

			true # signal helper rendered
		else
			# draw highlight
			for resourceId, resourceEventFootprints of map
				for eventFootprint in resourceEventFootprints
					rowObj = @view.getResourceRow(resourceId)
					rowObj.renderHighlight(eventFootprint.componentFootprint)

			false # signal helper not rendered


	unrenderDrag: ->
		for rowObj in @view.getEventRows()
			rowObj.helperRenderer.unrender()
			rowObj.unrenderHighlight()


	# Hit System
	# ---------------------------------------------------------------------------------


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


# Utils
# ---------------------------------------------------------------------------------


groupEventFootprintsByResourceId = (eventFootprints) ->
	map = {}

	for eventFootprint in eventFootprints
		(map[eventFootprint.componentFootprint.resourceId] or= [])
			.push(eventFootprint)

	map
