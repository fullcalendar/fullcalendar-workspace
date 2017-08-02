
class ResourceTimelineGridEventRenderer extends TimelineGridEventRenderer


	renderFgSegs: (segs) ->
		pairs = @view.pairSegsWithRows(segs)

		visiblePairs = []
		for pair in pairs
			[ containerObj, containerSegs ] = pair
			containerObj.fgSegs = containerSegs
			if containerObj.isShown
				containerObj.isSegsRendered = true
				visiblePairs.push(pair)

		@renderFgSegsInContainers(visiblePairs)
		@updateFollowers(segs)


	unrenderFgSegs: ->
		@clearFollowers()
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
