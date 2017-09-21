
class ResourceTimeGrid extends FC.TimeGrid

	@mixin ResourceDayTableMixin

	# configuration for DateComponent monkeypatch
	isResourceFootprintsEnabled: true


	renderDates: (dateProfile) ->
		@dateProfile = dateProfile
		@renderSlats()


	renderResources: (resourceRepo) ->
		@registerResourceRepo(resourceRepo)
		@renderColumns()

		if @headContainerEl
			@processHeadResourceEls(@headContainerEl)


	# TODO: make DRY with ResourceDayGrid
	getHitFootprint: (hit) ->
		plainFootprint = super

		new ResourceComponentFootprint(
			plainFootprint.unzonedRange,
			plainFootprint.isAllDay,
			@getColResource(hit.col).id
		)


	componentFootprintToSegs: (componentFootprint) ->
		resourceCnt = @resourceCnt
		genericSegs = @sliceRangeByTimes(componentFootprint.unzonedRange) # no assigned resources
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
