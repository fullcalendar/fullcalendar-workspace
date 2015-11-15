
class ResourceDayGrid extends FC.DayGrid

	@mixin ResourceGrid
	@mixin ResourceDayTableMixin


	getHitSpan: (hit) ->
		span = super
		if @resourceCnt
			span.resourceId = @getColResource(hit.col).id
		span


	rangeToSegs: (range) ->
		genericSegs = # no assigned resources
			if @datesAboveResources
				@sliceRangeByDay(range) # each day-per-resource will need its own column
			else
				@sliceRangeByRow(range)
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
						if @isRTL
							copy.leftCol = @indicesToCol(resourceIndex, seg.lastRowDayIndex)
							copy.rightCol = @indicesToCol(resourceIndex, seg.firstRowDayIndex)
						else
							copy.leftCol = @indicesToCol(resourceIndex, seg.firstRowDayIndex)
							copy.rightCol = @indicesToCol(resourceIndex, seg.lastRowDayIndex)
						resourceSegs.push(copy)
			resourceSegs

