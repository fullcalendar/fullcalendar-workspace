
###
A row that renders information about a particular resource, as well as it events (handled by superclass)
###
class ResourceRow extends EventRow

	resource: null

	constructor: (view, @resource) ->
		super

	###
	Called when a row in the tree has been added
	###
	rowAdded: (row) ->
		super
		if row != this and @isRendered # there is one new addition subrow
			if @children.length == 1 # first row was added?
				# update the expand icon
				@enableExpanding()
				if @isExpanded
					@indicateExpanded()
				else
					@indicateCollapsed()

	###
	Called when a row in the tree has been removed
	###
	rowRemoved: (row) ->
		super
		if row != this and @isRendered # there is one less subrow
			if not @children.length # no more rows?
				@disableExpanding()

	render: ->
		super

		if @children.length > 0
			@enableExpanding()
		else
			@disableExpanding()

		@view.trigger(
			'resourceRender',
			@resource, # this
			@resource,
			@getTr('spreadsheet').find('> td'), # TODO: optimize
			@getTr('event').find('> td') # TODO: optimize
		)


	renderEventContent: (tr) ->
		super
		tr.attr('data-resource-id', @resource.id)


	###
	Populates the TR with cells containing data about the resource
	###
	renderSpreadsheetContent: (tr) ->
		resource = @resource

		for colSpec in @view.colSpecs

			if colSpec.group # not responsible for group-based rows. VRowGroup is
				continue

			input = # the source text, and the main argument for the filter functions
				if colSpec.field
					resource[colSpec.field] or null
				else
					resource

			text =
				if typeof colSpec.text == 'function'
					colSpec.text(resource, input) # the colspec provided a text filter function
				else
					input

			contentEl = $(
				'<div class="fc-cell-content">' +
					(if colSpec.isMain then @renderGutterHtml() else '') +
					'<span class="fc-cell-text">' +
						(if text then htmlEscape(text) else '&nbsp;') +
					'</span>' +
				'</div>'
			)

			if typeof colSpec.render == 'function' # a filter function for the element
				contentEl = colSpec.render(resource, contentEl, input) or contentEl

			td = $('<td class="' + @view.widgetContentClass + '"/>')
				.append(contentEl)

			# the first cell of the row needs to have an inner div for setTrInnerHeight
			if colSpec.isMain
				td.wrapInner('<div/>')

			tr.append(td)

		tr.attr('data-resource-id', resource.id)


	###
	Renders the HTML responsible for the subrow expander area,
	as well as the space before it (used to align expanders of similar depths)
	###
	renderGutterHtml: ->
		html = ''
		for i in [0...@depth] by 1
			html += '<span class="fc-icon"/>'
		html +=
			'<span class="fc-expander-space">' +
				'<span class="fc-icon"></span>' +
			'</span>'
		html
