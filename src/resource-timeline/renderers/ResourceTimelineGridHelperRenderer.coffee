
class ResourceTimelineGridHelperRenderer extends TimelineGridHelperRenderer


	renderSegs: (segs, sourceSeg) ->
		pairs = @view.pairSegsWithRows(segs)
		@renderHelperSegsInContainers(pairs, sourceSeg)
