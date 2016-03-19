
class ScrollJoiner

	axis: null
	scrollers: null
	masterScroller: null


	constructor: (@axis, @scrollers) ->
		# will call assignMasterScroller immediately (true argument)
		# but won't process subsequent calls until time has passed
		@requestMasterScroller = debounce(@assignMasterScroller, 100, true)

		for scroller in @scrollers
			@initScroller(scroller)
		return


	initScroller: (scroller) ->

		# when the user scrolls via touch or mousewheel, we know for sure the target
		# scroller should be the master. capture the various x-browser events that fire.
		scroller.scrollEl.on 'touchmove wheel mousewheel DomMouseScroll MozMousePixelScroll', =>
			@assignMasterScroller(scroller)
			return

		scroller.on 'scroll', =>
			@requestMasterScroller(scroller)
			if scroller == @masterScroller
				for otherScroller in @scrollers
					if otherScroller != scroller
						switch @axis
							when 'horizontal'
								otherScroller.setNativeScrollLeft(scroller.getNativeScrollLeft())
							when 'vertical'
								otherScroller.setScrollTop(scroller.getScrollTop())
			return


	requestMasterScroller: null # created in the constructor


	assignMasterScroller: (@masterScroller) ->


	update: ->
		allWidths = for scroller in @scrollers
			scroller.getScrollbarWidths()

		maxLeft = maxRight = maxTop = maxBottom = 0
		for widths in allWidths
			maxLeft = Math.max(maxLeft, widths.left)
			maxRight = Math.max(maxRight, widths.right)
			maxTop = Math.max(maxTop, widths.top)
			maxBottom = Math.max(maxBottom, widths.bottom)

		for scroller, i in @scrollers
			widths = allWidths[i]
			scroller.canvas.setGutters \
				if @axis == 'horizontal'
					left: maxLeft - widths.left
					right: maxRight - widths.right
				else
					top: maxTop - widths.top
					bottom: maxBottom - widths.bottom
		return
