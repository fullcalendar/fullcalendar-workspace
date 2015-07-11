
class ScrollJoiner

	axis: null
	scrollers: null
	masterScroller: null
	enabled: true


	constructor: (@axis, @scrollers) ->
		for scroller in @scrollers
			@initScroller(scroller)


	enable: ->
		@enabled = true


	disable: ->
		@enabled = false


	initScroller: (scroller) ->

		# TODO: any way to use "this" ?
		scroller
			.on 'scrollStart', =>

				#if not @enabled
				#	return

				if not @masterScroller
					@masterScroller = scroller
				return

			.on 'scroll', (scrollTop, scrollLeft) => # TODO: reverse arguments

				#if not @enabled
				#	return

				#NOTE: it's okay because these are nativeScrollTop/nativeScrollLeft
				if scroller is @masterScroller

					for otherScroller in @scrollers
						if otherScroller isnt @masterScroller
							switch @axis
								when 'horizontal'
									otherScroller.scrollLeft(scrollLeft)
								when 'vertical'
									otherScroller.scrollTop(scrollTop)
				return

			.on 'scrollStop', =>

				#if not @enabled
				#	return

				if scroller is @masterScroller
					@masterScroller = null
				return


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
			scroller.setGutters \
				if @axis == 'horizontal'
					left: maxLeft - widths.left
					right: maxRight - widths.right
				else
					top: maxTop - widths.top
					bottom: maxBottom - widths.bottom
		return
