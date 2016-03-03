
###
A rectangular area of content that lives within a Scroller.
Can have "gutters", areas of dead spacing around the perimeter.
Also very useful for forcing a width, which a Scroller cannot do alone.
Has a content area that lives above a background area.
###
class ScrollerCanvas

	el: null
	contentEl: null
	bgEl: null
	gutters: null # an object {top,left,bottom,right}
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


	###
	If falsy, resets all the gutters to 0
	###
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

		@el # is border-box (width includes padding)
			.toggleClass('fc-gutter-left', Boolean(gutters.left))
			.toggleClass('fc-gutter-right', Boolean(gutters.right))
			.toggleClass('fc-gutter-top', Boolean(gutters.top))
			.toggleClass('fc-gutter-bottom', Boolean(gutters.bottom))
			.css
				paddingLeft: gutters.left or ''
				paddingRight: gutters.right or ''
				paddingTop: gutters.top or ''
				paddingBottom: gutters.bottom or ''
				width:
					if @width?
						@width + (gutters.left or 0) + (gutters.right or 0)
					else
						''
				minWidth:
					if @minWidth?
						@minWidth + (gutters.left or 0) + (gutters.right or 0)
					else
						''

		@bgEl.css
			left: gutters.left or ''
			right: gutters.right or ''
			top: gutters.top or ''
			bottom: gutters.bottom or ''
