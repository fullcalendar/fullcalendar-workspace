
class ResourceTimelineEventRenderer extends TimelineEventRenderer


	# don't render any fg segs
	renderFgRanges: (eventRanges) ->
		return


	unrenderFgRanges: ->
		return # otherwise will try do manip DOM, js error
