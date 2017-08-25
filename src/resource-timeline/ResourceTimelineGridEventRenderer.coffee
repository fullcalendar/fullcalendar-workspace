
class ResourceTimelineGridEventRenderer extends TimelineEventRenderer


	# don't render any fg segs
	renderFgRanges: (eventRanges) ->
		return


	unrenderFgRanges: ->
		return # otherwise will try do manip DOM, js error


	# only render bg segs that have no resources
	renderBgRanges: (eventRanges) ->
		eventRanges = eventRanges.filter (eventRange) ->
			eventDef = eventRange.eventDef
			eventDef.getResourceIds().length == 0 and eventDef.hasBgRendering()

		super(eventRanges)
