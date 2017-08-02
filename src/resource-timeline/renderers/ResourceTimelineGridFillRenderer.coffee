
class ResourceTimelineGridFillRenderer extends TimelineGridFillRenderer


	attachSegEls: (type, segs) ->
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

		@attachSegElsToContainers(type, visiblePairs)

		segs


	unrender: ->
		eventRows = @view.getEventRows()

		# TODO: overaggressive? what if bg-events don't use the fill system
		for eventRow in eventRows
			eventRow.bgSegs = null
