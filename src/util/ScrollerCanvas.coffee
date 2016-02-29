
class ScrollerCanvas

	el: null
	contentEl: null
	bgEl: null
	gutters: null
	width: null
	minWidth: null

	constructor: ->
		@gutters = {}

	render: ->
		@el = $('
			<div class="fc-scroller-canvas">
				<div class="fc-content"></div>
				<div class="fc-bg"></div>
			</div>
		')
		@contentEl = @el.find('.fc-content')
		@bgEl = @el.find('.fc-bg')

	setGutters: (gutters) ->
		if not gutters
			@gutters = {}
		else
			$.extend(@gutters, gutters)
		@updateSize()

	setWidth: (@width) ->
		@updateSize()

	setMinWidth: (@minWidth) ->
		@updateSize()

	clearWidth: ->
		@width = null
		@minWidth = null
		@updateSize()

	updateSize: ->
		gutters = @gutters

		@el.css # is border-box
			paddingLeft: gutters.left or ''
			paddingRight: gutters.right or ''
			paddingTop: gutters.top or ''
			paddingBottom: gutters.bottom or ''
			width:
				if @width
					@width + (gutters.left or 0) + (gutters.right or 0)
				else
					''
			minWidth:
				if @minWidth
					@minWidth + (gutters.left or 0) + (gutters.right or 0)

		@bgEl.css
			left: gutters.left or ''
			right: gutters.right or ''
			top: gutters.top or ''
			bottom: gutters.bottom or ''
