
# TODO: talk about what "masked" means

class MaskedScroller extends EnhancedScroller

	isHScrollbarsMasked: false
	isVScrollbarsMasked: false


	constructor: ->
		super

		if @overflowX == 'masked'
			@overflowX = 'scroll'
			@isHScrollbarsMasked = true

		if @overflowY == 'masked'
			@overflowY = 'scroll'
			@isVScrollbarsMasked = true


	renderEl: ->
		scrollEl = super
		$('<div class="fc-scroller-mask" />').append(scrollEl) # return value


	updateSize: ->
		scrollEl = @scrollEl
		scrollbarWidths = getScrollbarWidths(scrollEl) # the native ones
		cssProps = { marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 }

		if @isHScrollbarsMasked
			cssProps.marginTop = -scrollbarWidths.top
			cssProps.marginBottom = -scrollbarWidths.bottom

		if @isVScrollbarsMasked
			cssProps.marginLeft = -scrollbarWidths.left
			cssProps.marginRight = -scrollbarWidths.right

		scrollEl.css(cssProps)

		# if we are attempting to hide the scrollbars offscreen, OSX/iOS will still
		# display the floating scrollbars. force-hide them.
		scrollEl.toggleClass(
			'fc-no-scrollbars'
			(@isHScrollbarsMasked or @overflowX == 'hidden') and # should never show?
			(@isVScrollbarsMasked or @overflowY == 'hidden') and # should never show?
			not ( # doesn't have any scrollbar mass
				scrollbarWidths.top or
				scrollbarWidths.bottom or
				scrollbarWidths.left or
				scrollbarWidths.right
			)
		)


	getScrollbarWidths: ->
		widths = getScrollbarWidths(@scrollEl)

		if @isHScrollbarsMasked
			widths.top = 0
			widths.bottom = 0

		if @isVScrollbarsMasked
			widths.left = 0
			widths.right = 0

		widths
