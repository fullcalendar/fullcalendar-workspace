
class ResourceTimeGrid extends FC.TimeGrid

	@mixin ResourceGrid
	@mixin ResourceDayTableMixin


	getHitSpan: (hit) ->
		span = super
		if @resourceCnt
			span.resourceId = @getColResource(hit.col).id
		span


	rangeToSegs: (range) ->
		resourceCnt = @resourceCnt
		genericSegs = @sliceRangeByTimes(range) # no assigned resources

		if not resourceCnt
			for seg in genericSegs
				seg.col = seg.dayIndex
			genericSegs
		else
			resourceSegs = []
			for seg in genericSegs
				for resourceIndex in [0...resourceCnt] by 1
					resourceObj = @flattenedResources[resourceIndex]
					if not range.resourceId or range.resourceId == resourceObj.id
						copy = $.extend({}, seg)
						copy.col = @indicesToCol(resourceIndex, seg.dayIndex)
						resourceSegs.push(copy)
			resourceSegs
