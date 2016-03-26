
COL_MIN_WIDTH = 30


class Spreadsheet

	view: null

	headEl: null
	el: null # for body
	tbodyEl: null

	headScroller: null
	bodyScroller: null
	joiner: null


	constructor: (@view) ->
		@isRTL = @view.opt('isRTL') # doesn't descend from Grid, so needs to do this

		@givenColWidths = @colWidths = (colSpec.width for colSpec in @view.colSpecs)


	# Rendering
	# ---------------------------------------------------------------------------------

	colGroupHtml: ''
	headTable: null
	headColEls: null
	headCellEls: null
	bodyColEls: null
	bodyTable: null


	renderSkeleton: ->

		@headScroller = new ClippedScroller
			overflowX: 'clipped-scroll'
			overflowY: 'hidden'
		@headScroller.canvas = new ScrollerCanvas()
		@headScroller.render()
		@headScroller.canvas.contentEl.html(@renderHeadHtml())
		@headEl.append(@headScroller.el)

		@bodyScroller = new ClippedScroller
			overflowY: 'clipped-scroll'
		@bodyScroller.canvas = new ScrollerCanvas()
		@bodyScroller.render()
		@bodyScroller.canvas.contentEl.html('<table>' + @colGroupHtml + '<tbody/></table>') # colGroupHtml hack
		@tbodyEl = @bodyScroller.canvas.contentEl.find('tbody')
		@el.append(@bodyScroller.el)

		@joiner = new ScrollJoiner('horizontal', [ @headScroller, @bodyScroller ])

		@headTable = @headEl.find('table')
		@headColEls = @headEl.find('col')
		@headCellEls = @headScroller.canvas.contentEl.find('tr:last-child th')
		@bodyColEls = @el.find('col')
		@bodyTable = @el.find('table')

		@colMinWidths = @computeColMinWidths()
		@applyColWidths()
		@initColResizing()


	renderHeadHtml: ->
		colSpecs = @view.colSpecs
		
		html = '<table>'

		colGroupHtml = '<colgroup>'
		for o in colSpecs
			if o.isMain
				colGroupHtml += '<col class="fc-main-col"/>'
			else
				colGroupHtml += '<col/>'

		colGroupHtml += '</colgroup>'
		@colGroupHtml = colGroupHtml
		html += colGroupHtml

		html += '<tbody>'

		if (@view.superHeaderText)
			html +=
				'<tr class="fc-super">' +
					'<th class="' + @view.widgetHeaderClass + '" colspan="' + colSpecs.length + '">' +
						'<div class="fc-cell-content">' +
							'<span class="fc-cell-text">' +
								htmlEscape(@view.superHeaderText) +
							'</span>' +
						'</div>' +
					'</th>' +
				'</tr>'

		html += '<tr>'

		isMainCol = true
		for o, i in colSpecs
			isLast = i == colSpecs.length - 1

			html +=
				'<th class="' + @view.widgetHeaderClass + '">' +
					'<div>' +
						'<div class="fc-cell-content">' +
							(if o.isMain
								'<span class="fc-expander-space">' +
									'<span class="fc-icon"></span>' +
								'</span>'
							else
								'') +
							'<span class="fc-cell-text">' +
								htmlEscape(o.labelText or '') + # what about normalizing this value ahead of time?
							'</span>' +
						'</div>' +
						(if not isLast then '<div class="fc-col-resizer"></div>' else '') +
					'</div>' +
				'</th>'

		html += '</tr>'

		html += '</tbody></table>'

		html


	# Column Resizing
	# ---------------------------------------------------------------------------------

	givenColWidths: null
	colWidths: null
	colMinWidths: null
	tableWidth: null
	tableMinWidth: null


	initColResizing: ->
		@headEl.find('th .fc-col-resizer').each (i, resizerEl) =>
			resizerEl = $(resizerEl)
			resizerEl.on 'mousedown', (ev) =>
				@colResizeMousedown(i, ev, resizerEl)


	colResizeMousedown: (i, ev, resizerEl) ->
		colWidths = @colWidths = @queryColWidths()
		colWidths.pop()
		colWidths.push(null) # will result in 'auto' or ''

		origColWidth = colWidths[i]
		minWidth = Math.min(@colMinWidths[i], COL_MIN_WIDTH) # if given width is smaller, allow it

		dragListener = new DragListener

			dragStart: =>
				resizerEl.addClass('fc-active')

			drag: (dx, dy) =>
				width = origColWidth + (if @isRTL then -dx else dx)
				width = Math.max(width, minWidth)
				colWidths[i] = width
				@applyColWidths()

			dragEnd: =>
				resizerEl.removeClass('fc-active')

		dragListener.startInteraction(ev)


	applyColWidths: ->
		colMinWidths = @colMinWidths
		colWidths = @colWidths
		allNumbers = true
		anyPercentages = false
		total = 0

		for colWidth in colWidths
			if typeof colWidth == 'number'
				total += colWidth
			else
				allNumbers = false
				if colWidth
					anyPercentages = true

		# percentage widths play better with 'auto' but h-grouped cells don't
		defaultCssWidth =
			if anyPercentages and not @view.isHGrouping
				'auto'
			else
				''

		cssWidths = for colWidth, i in colWidths
			colWidth ? defaultCssWidth

		#if allNumbers
		#	cssWidths.pop()
		#	cssWidths.push('auto')

		tableMinWidth = 0
		for cssWidth, i in cssWidths
			tableMinWidth +=
				if typeof cssWidth == 'number'
					cssWidth
				else
					colMinWidths[i]

		for cssWidth, i in cssWidths
			@headColEls.eq(i).width(cssWidth)
			@bodyColEls.eq(i).width(cssWidth)

		@headScroller.canvas.setMinWidth(tableMinWidth) # not really a table width anymore
		@bodyScroller.canvas.setMinWidth(tableMinWidth)

		@tableMinWidth = tableMinWidth
		@tableWidth = if allNumbers then total


	computeColMinWidths: ->
		for width, i in @givenColWidths
			if typeof width == 'number'
				width
			else
				parseInt(@headColEls.eq(i).css('min-width')) or COL_MIN_WIDTH


	queryColWidths: ->
		for node in @headCellEls
			$(node).outerWidth()


	# Sizing
	# ---------------------------------------------------------------------------------


	updateWidth: ->
		@headScroller.updateSize()
		@bodyScroller.updateSize()
		@joiner.update()

		# TODO: do follower.disable(), instead of checking for existence all the time
		if @follower
			@follower.update()


	headHeight: -> # TODO: route this better
		table = @headScroller.canvas.contentEl.find('table')
		table.height.apply(table, arguments)

