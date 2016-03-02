
class ResourceTimeGrid extends FC.TimeGrid

	@mixin ResourceGridMixin
	@mixin ResourceDayTableMixin


	getHitSpan: (hit) ->
		span = super
		if @resourceCnt
			span.resourceId = @getColResource(hit.col).id
		span


	spanToSegs: (span) ->
		resourceCnt = @resourceCnt
		genericSegs = @sliceRangeByTimes(span) # no assigned resources

		if not resourceCnt
			for seg in genericSegs
				seg.col = seg.dayIndex
			genericSegs
		else
			resourceSegs = []
			for seg in genericSegs
				for resourceIndex in [0...resourceCnt] by 1
					resourceObj = @flattenedResources[resourceIndex]
					if not span.resourceId or span.resourceId == resourceObj.id
						copy = $.extend({}, seg)
						copy.resource = resourceObj
						copy.col = @indicesToCol(resourceIndex, seg.dayIndex)
						resourceSegs.push(copy)
			resourceSegs
