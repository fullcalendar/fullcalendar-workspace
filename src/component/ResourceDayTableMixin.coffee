###
Requirements:
- must be a Grid
- grid must have a view that's a ResourceView
- DayTableMixin must already be mixed in
###
ResourceDayTableMixin =

	flattenedResources: null
	resourceCnt: 0
	datesAboveResources: false
	allowCrossResource: false # change setting for InteractiveDateComponent monkeypatch


	# Resource Data
	# ----------------------------------------------------------------------------------------------


	# does not do any rendering. rendering is responsibility of host object
	registerResources: (resources) ->
		@flattenedResources = @flattenResources(resources)
		@resourceCnt = @flattenedResources.length
		@updateDayTable() # will call computeColCnt


	# flattens and sorts
	flattenResources: (resources) ->
		orderVal = @opt('resourceOrder')
		if orderVal
			orderSpecs = parseFieldSpecs(orderVal)
			sortFunc = (a, b) ->
				compareByFieldSpecs(a, b, orderSpecs)
		else
			sortFunc = null
		res = []
		@accumulateResources(resources, sortFunc, res)
		res


	# just flattens
	accumulateResources: (resources, sortFunc, res) ->
		if sortFunc
			sortedResources = resources.slice(0) # make copy
			sortedResources.sort(sortFunc) # sorts in place
		else
			sortedResources = resources
		for resource in sortedResources
			res.push(resource)
			@accumulateResources(resource.children, sortFunc, res)


	# Table Layout
	# ----------------------------------------------------------------------------------------------


	updateDayTableCols: ->
		@datesAboveResources = @opt('groupByDateAndResource')
		FC.DayTableMixin::updateDayTableCols.call(this)


	computeColCnt: ->
		@resourceCnt * @daysPerRow


	getColDayIndex: (col) ->
		if @isRTL
			col = @colCnt - 1 - col
		if @datesAboveResources
			Math.floor(col / (@resourceCnt or 1))
		else
			col % @daysPerRow


	getColResource: (col) ->
		@flattenedResources[@getColResourceIndex(col)]


	getColResourceIndex: (col) ->
		if @isRTL
			col = @colCnt - 1 - col
		if @datesAboveResources
			col % (@resourceCnt or 1)
		else
			Math.floor(col / @daysPerRow)


	indicesToCol: (resourceIndex, dayIndex) ->
		col =
			if @datesAboveResources
				dayIndex * (@resourceCnt or 1) + resourceIndex
			else
				resourceIndex * @daysPerRow + dayIndex
		if @isRTL
			col = @colCnt - 1 - col
		col


	# Header Rendering
	# ----------------------------------------------------------------------------------------------


	renderHeadTrHtml: -> # might return two trs
		if @daysPerRow > 1
			# do two levels
			if @datesAboveResources
				@renderHeadDateAndResourceHtml()
			else
				@renderHeadResourceAndDateHtml()
		else
			# do one level
			@renderHeadResourceHtml()


	# renders one row of resources header cell
	renderHeadResourceHtml: ->
		resourceHtmls = []

		for resource in @flattenedResources
			resourceHtmls.push \
				@renderHeadResourceCellHtml(resource)

		if not resourceHtmls.length
			resourceHtmls.push('<td>&nbsp;</td>')

		@wrapTr(resourceHtmls, 'renderHeadIntroHtml')


	# renders resource cells above date cells
	renderHeadResourceAndDateHtml: ->
		resourceHtmls = []
		dateHtmls = []

		for resource in @flattenedResources
			resourceHtmls.push \
				@renderHeadResourceCellHtml(resource, null, @daysPerRow)

			for dayIndex in [0...@daysPerRow] by 1
				date = @dayDates[dayIndex].clone()
				dateHtmls.push \
					@renderHeadResourceDateCellHtml(date, resource)

		if not resourceHtmls.length
			resourceHtmls.push('<td>&nbsp;</td>')

		if not dateHtmls.length
			dateHtmls.push('<td>&nbsp;</td>')

		@wrapTr(resourceHtmls, 'renderHeadIntroHtml') +
			@wrapTr(dateHtmls, 'renderHeadIntroHtml')


	# renders date cells above resource cells
	renderHeadDateAndResourceHtml: ->
		dateHtmls = []
		resourceHtmls = []

		for dayIndex in [0...@daysPerRow] by 1
			date = @dayDates[dayIndex].clone()
			dateHtmls.push \
				@renderHeadDateCellHtml(date, @resourceCnt) # with colspan

			for resource in @flattenedResources
				resourceHtmls.push \
					@renderHeadResourceCellHtml(resource, date)

		if not dateHtmls.length
			dateHtmls.push('<td>&nbsp;</td>')

		if not resourceHtmls.length
			resourceHtmls.push('<td>&nbsp;</td>')

		@wrapTr(dateHtmls, 'renderHeadIntroHtml') +
			@wrapTr(resourceHtmls, 'renderHeadIntroHtml')


	# given a resource and an optional date
	renderHeadResourceCellHtml: (resource, date, colspan) ->
		'<th class="fc-resource-cell"' +
			' data-resource-id="' + resource.id + '"' +
			(if date
				' data-date="' + date.format('YYYY-MM-DD') + '"'
			else
				'') +
			(if colspan > 1
				' colspan="' + colspan + '"'
			else
				'') +
		'>' +
			htmlEscape(
				@view.getResourceText(resource)
			) +
		'</th>'


	# given a date and a required resource
	renderHeadResourceDateCellHtml: (date, resource, colspan) ->
		@renderHeadDateCellHtml(
			date,
			colspan,
			'data-resource-id="' + resource.id + '"'
		)


	# given a container with already rendered resource cells
	processHeadResourceEls: (containerEl) ->
		containerEl.find('.fc-resource-cell').each (col, node) =>

			if @datesAboveResources
				# each resource <td> is a distinct column
				resource = @getColResource(col)
			else
				# each resource <td> covers multiple columns of dates
				resource = @flattenedResources[\
					if @isRTL
						@flattenedResources.length - 1 - col
					else
						col
				]

			@publiclyTrigger('resourceRender', {
				context: resource,
				args: [
					resource
					$(node) # head <td>
					$() # body <td>'s (we don't compute, but API should stay consistent)
					@view
				]
			})


	# Bg Rendering
	# ----------------------------------------------------------------------------------------------
	# TODO: unify with DayTableMixin more, instead of completely redefining


	renderBgCellsHtml: (row) ->
		htmls = []

		for col in [0...@colCnt] by 1
			date = @getCellDate(row, col)
			resource = @getColResource(col)
			htmls.push(@renderResourceBgCellHtml(date, resource))

		if not htmls.length
			htmls.push('<td>&nbsp;</td>')

		htmls.join('') # already accounted for RTL


	renderResourceBgCellHtml: (date, resource) ->
		@renderBgCellHtml(date, 'data-resource-id="' + resource.id + '"')


	# Rendering Utils
	# ----------------------------------------------------------------------------------------------

	# only works for when given cells are ordered chronologically
	# mutates cellHtmls
	# TODO: make this a DayTableMixin utility
	wrapTr: (cellHtmls, introMethodName) ->
		if @isRTL
			cellHtmls.reverse()
			'<tr>' +
				cellHtmls.join('') +
				this[introMethodName]() +
			'</tr>'
		else
			'<tr>' +
				this[introMethodName]() +
				cellHtmls.join('') +
			'</tr>'

	# Business Hours
	# ----------------------------------------------------------------------------------------------


	renderBusinessHours: (businessHourGenerator) ->
		isAllDay = @hasAllDayBusinessHours
		unzonedRange = @dateProfile.activeUnzonedRange
		eventFootprints = []

		for resource in @flattenedResources

			eventInstanceGroup = (resource.businessHourGenerator or businessHourGenerator)
				.buildEventInstanceGroup(isAllDay, unzonedRange)

			if eventInstanceGroup
				for eventRange in eventInstanceGroup.sliceRenderRanges(unzonedRange)
					eventFootprints.push(
						new EventFootprint(
							new ResourceComponentFootprint(
								eventRange.unzonedRange
								isAllDay
								resource.id
							)
							eventRange.eventDef
							eventRange.eventInstance
						)
					)

		@businessHourRenderer.renderEventFootprints(eventFootprints)
