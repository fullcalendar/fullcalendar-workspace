
class ResourceDayGrid extends FC.DayGrid

	@mixin ResourceGridMixin
	@mixin ResourceDayTableMixin


	# TODO: make DRY with ResourceTimeGrid
	getHitFootprint: (hit) ->
		plainFootprint = super

		if @resourceCnt
			new ResourceComponentFootprint(
				plainFootprint.unzonedRange,
				plainFootprint.isAllDay,
				@getColResource(hit.col).id
			)
		else
			plainFootprint


	componentFootprintToSegs: (componentFootprint) ->
		resourceCnt = @resourceCnt
		genericSegs = # no assigned resources
			if @datesAboveResources
				@sliceRangeByDay(componentFootprint.unzonedRange.getRange()) # each day-per-resource will need its own column
			else
				@sliceRangeByRow(componentFootprint.unzonedRange.getRange())

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

					if not (componentFootprint instanceof ResourceComponentFootprint) or
							componentFootprint.resourceId == resourceObj.id
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


	renderBusinessHours: ->
		segs = @computePerResourceBusinessHourSegs(true) # wholeDay=true
		if segs
			@renderFill('businessHours', segs, 'bgevent')
		else
			super # render global business hours
