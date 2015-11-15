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
		orderSpecs = parseFieldSpecs(@view.opt('resourceOrder'))
		sortFunc = (a, b) ->
			compareByFieldSpecs(a, b, orderSpecs)
		res = []
		@accumulateResources(resources, sortFunc, res)
		res

	# just flattens
	accumulateResources: (resources, sortFunc, res) ->
		sortedResources = resources.slice(0) # make copy
		sortedResources.sort(sortFunc) # sorts in place
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
					@renderHeadDateTrHtml(1, @resourceCnt) +
						@renderHeadResourceTrHtml(@daysPerRow)
				else
					@renderHeadResourceTrHtml(1, @daysPerRow) +
						@renderHeadDateTrHtml(@resourceCnt)
			else
				# do one level
				@renderHeadResourceTrHtml()


	# Date

	renderHeadDateTrHtml: (repeat, colspan) ->
		'<tr>' +
			(if @isRTL then '' else @renderHeadIntroHtml()) +
			@renderHeadDateCellsHtml(repeat, colspan) +
			(if @isRTL then @renderHeadIntroHtml() else '') +
		'</tr>'


	renderHeadDateCellsHtml: (repeat=1, colspan=1) ->
		htmls = []
		for i in [0...repeat] by 1
			for dayIndex in [0...@daysPerRow] by 1
				date = @dayDates[dayIndex].clone()
				htmls.push(@renderHeadDateCellHtml(date, colspan))
		if @isRTL
			htmls.reverse()
		htmls.join('')


	# Resource

	renderHeadResourceTrHtml: (repeat, colspan) ->
		'<tr>' +
			(if @isRTL then '' else @renderHeadIntroHtml()) +
			@renderHeadResourceCellsHtml(repeat, colspan) +
			(if @isRTL then @renderHeadIntroHtml() else '') +
		'</tr>'


	renderHeadResourceCellsHtml: (repeat=1, colspan=1) ->
		htmls = []
		for i in [0...repeat] by 1
			for resource in @flattenedResources
				htmls.push(@renderHeadResourceCellHtml(resource, colspan))
		if @isRTL
			htmls.reverse()
		htmls.join('')


	renderHeadResourceCellHtml: (resource, colspan=1) ->
		'<th class="fc-resource-cell"' +
			(if colspan > 1 then ' colspan="' + colspan + '"' else '') +
			'>' +
			htmlEscape(
				@view.getResourceText(resource)
			) +
		'</th>'


	processHeadResourceEls: (containerEl) ->
		containerEl.find('.fc-resource-cell').each (col, node) =>
			resource = @getColResource(col)
			@view.trigger(
				'resourceRender',
				resource, # this
				resource,
				$(node)
			)
