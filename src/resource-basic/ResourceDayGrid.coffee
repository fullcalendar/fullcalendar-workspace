
class ResourceDayGrid extends FC.DayGrid

	@mixin ResourceDayTableMixin

	# configuration for DateComponent monkeypatch
	isResourceFootprintsEnabled: true


	constructor: ->
		super
		@watchDisplayingDatesAndResources()


	# TODO: make DRY with ResourceTimeGrid
	getHitFootprint: (hit) ->
		plainFootprint = super

		new ResourceComponentFootprint(
			plainFootprint.unzonedRange,
			plainFootprint.isAllDay,
			@getColResource(hit.col).id
		)


	componentFootprintToSegs: (componentFootprint) ->
		resourceCnt = @resourceCnt
		genericSegs = # no assigned resources
			if @datesAboveResources
				@sliceRangeByDay(componentFootprint.unzonedRange) # each day-per-resource will need its own column
			else
				@sliceRangeByRow(componentFootprint.unzonedRange)

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
