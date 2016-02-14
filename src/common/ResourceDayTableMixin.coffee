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
	allowCrossResource: false # change setting in ResourceGrid


	# Resource Data
	# ----------------------------------------------------------------------------------------------


	# getting called twice unfortuntately :(
	setResources: (resources) ->
		@flattenedResources = @flattenResources(resources)
		@resourceCnt = @flattenedResources.length
		@updateDayTableCols() # will call computeColCnt


	unsetResources: ->
		@flattenedResources = null
		@resourceCnt = 0
		@updateDayTableCols() # will call computeColCnt


	# flattens and sorts
	flattenResources: (resources) ->
		orderVal = @view.opt('resourceOrder')
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
		@datesAboveResources = @view.opt('groupByDateAndResource')
		FC.DayTableMixin.updateDayTableCols.call(this)


	computeColCnt: ->
		(@resourceCnt or 1) * @daysPerRow


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
		if not @resourceCnt
			FC.DayTableMixin.renderHeadTrHtml.call(this)
		else
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

			@view.trigger(
				'resourceRender',
				resource, # this
				resource,
				$(node) # head <td>
				$() # body <td>'s (we don't compute, but API should stay consistent)
			)


	# Bg Rendering
	# ----------------------------------------------------------------------------------------------
	# TODO: unify with DayTableMixin more, instead of completely redefining


	renderBgCellsHtml: (row) ->
		if not @resourceCnt
			FC.DayTableMixin.renderBgCellsHtml.call(this, row)
		else
			htmls = []

			for col in [0...@colCnt] by 1
				date = @getCellDate(row, col)
				resource = @getColResource(col)
				htmls.push(@renderResourceBgCellHtml(date, resource))

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
