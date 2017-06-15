
class ResourceTimeGrid extends FC.TimeGrid

	@mixin ResourceGridMixin
	@mixin ResourceDayTableMixin


	# TODO: make DRY with ResourceDayGrid
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
		genericSegs = @sliceRangeByTimes(componentFootprint.unzonedRange.getRange()) # no assigned resources

		if not resourceCnt
			for seg in genericSegs
				seg.col = seg.dayIndex
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
						copy.col = @indicesToCol(resourceIndex, seg.dayIndex)
						resourceSegs.push(copy)

			resourceSegs


	renderBusinessHours: ->
		segs = @computePerResourceBusinessHourSegs(false) # wholeDay=false
		if segs
			@renderBusinessSegs(segs)
		else
			super # render global business hours
