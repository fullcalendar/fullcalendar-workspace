
class ResourceTimeGrid extends FC.TimeGrid

	@mixin ResourceGrid
	@mixin ResourceDayTableMixin


	getHitSpan: (hit) ->
		span = super
		if @resourceCnt
			span.resourceId = @getColResource(hit.col).id
		span


	rangeToSegs: (range) ->
		genericSegs = @sliceRangeByTimes(range) # no assigned resources
		resourceCnt = @resourceCnt
		if not resourceCnt
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
