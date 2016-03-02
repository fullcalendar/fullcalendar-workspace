
class ResourceDayGrid extends FC.DayGrid

	@mixin ResourceGridMixin
	@mixin ResourceDayTableMixin


	getHitSpan: (hit) ->
		span = super
		if @resourceCnt
			span.resourceId = @getColResource(hit.col).id
		span


	spanToSegs: (span) ->
		resourceCnt = @resourceCnt
		genericSegs = # no assigned resources
			if @datesAboveResources
				@sliceRangeByDay(span) # each day-per-resource will need its own column
			else
				@sliceRangeByRow(span)

		if not resourceCnt
			for seg in genericSegs
				if @isRTL
					seg.leftCol = seg.lastRowDayIndex
					seg.rightCol = seg.firstRowDayIndex
				else
					seg.leftCol = seg.firstRowDayIndex
					seg.rightCol = seg.lastRowDayIndex
			genericSegs
		else
			resourceSegs = []
			for seg in genericSegs
				for resourceIndex in [0...resourceCnt] by 1
					resourceObj = @flattenedResources[resourceIndex]
					if not span.resourceId or span.resourceId == resourceObj.id
						copy = $.extend({}, seg)
						copy.resource = resourceObj
						if @isRTL
							copy.leftCol = @indicesToCol(resourceIndex, seg.lastRowDayIndex)
							copy.rightCol = @indicesToCol(resourceIndex, seg.firstRowDayIndex)
						else
							copy.leftCol = @indicesToCol(resourceIndex, seg.firstRowDayIndex)
							copy.rightCol = @indicesToCol(resourceIndex, seg.lastRowDayIndex)
						resourceSegs.push(copy)
			resourceSegs

