
class EnhancedScroller extends FC.Scroller

	canvas: null # an optional ScrollerCanvas
	isScrolling: false
	isTouching: false # user currently has finger down?
	isMoving: false # whether a scroll event has happened recently


	constructor: ->
		super
		@requestMovingEnd = debounce(@reportMovingEnd, 500)


	render: ->
		super
		if @canvas
			@canvas.render()
			@canvas.el.appendTo(@scrollEl)
		@bindHandlers()


	destroy: ->
		super
		@unbindHandlers()


	# Handlers
	# ----------------------------------------------------------------------------------------------


	bindHandlers: ->
		@scrollEl
			.on('scroll', this._scroll = proxy(this, 'reportScroll'))
			.on('touchstart', this._touchstart = proxy(this, 'reportTouchStart'))
			.on('touchend', this._touchend = proxy(this, 'reportTouchEnd'))


	unbindHandlers: -> # TODO: find a better way
		@scrollEl
			.off('scroll', this._scroll)
			.off('touchstart', this._touchstart)
			.off('touchend', this._touchend)


	# Scroll Events
	# ----------------------------------------------------------------------------------------------


	reportScroll: ->
		if not @isScrolling
			@reportScrollStart()
		@trigger('scroll')
		@isMoving = true
		@requestMovingEnd()


	reportScrollStart: ->
		if not @isScrolling
			@isScrolling = true
			@trigger('scrollStart', @isTouching)


	requestMovingEnd: null # created in constructor


	reportMovingEnd: ->
		@isMoving = false

		# only end the scroll if not currently touching.
		# if touching, the scrolling will end later, on touchend.
		if not @isTouching
			@reportScrollEnd()


	reportScrollEnd: ->
		if @isScrolling
			@trigger('scrollEnd')
			@isScrolling = false


	# Touch Events
	# ----------------------------------------------------------------------------------------------


	# will fire *before* the scroll event is fired
	reportTouchStart: ->
		@isTouching = true


	reportTouchEnd: ->
		if @isTouching
			@isTouching = false

			# if the user ended their touch, and the scroll area wasn't moving,
			# we consider this to be the end of the scroll.
			if not @isMoving
				@reportScrollEnd() # won't fire if already ended


	# Horizontal Scroll Normalization
	# ----------------------------------------------------------------------------------------------
	# http://stackoverflow.com/questions/24276619/better-way-to-get-the-viewport-of-a-scrollable-div-in-rtl-mode/24394376#24394376


	getScrollLeft: ->
		direction = @scrollEl.css('direction')
		node = @scrollEl[0]
		val = node.scrollLeft
		if direction is 'rtl'
			switch rtlScrollSystem
				when 'positive'
					val = val + node.clientWidth - node.scrollWidth
				when 'reverse'
					val = -val
		val


	setScrollLeft: (val) ->
		direction = @scrollEl.css('direction')
		node = @scrollEl[0]
		if direction is 'rtl'
			switch rtlScrollSystem
				when 'positive'
					val = val - node.clientWidth + node.scrollWidth
				when 'reverse'
					val = -val
		node.scrollLeft = val


	getScrollFromLeft: ->
		direction = @scrollEl.css('direction')
		node = @scrollEl[0]
		val = node.scrollLeft
		if direction is 'rtl'
			switch rtlScrollSystem
				when 'negative'
					val = val - node.clientWidth + node.scrollWidth
				when 'reverse'
					val = -val - node.clientWidth + node.scrollWidth
		val


	getNativeScrollLeft: ->
		@scrollEl[0].scrollLeft


	setNativeScrollLeft: (val) ->
		@scrollEl[0].scrollLeft = val


	# Horizontal Scroll System Detection
	# ----------------------------------------------------------------------------------------------

	rtlScrollSystem = null

	detectRtlScrollSystem = ->
		el = $('
			<div style="
			position: absolute
			top: -1000px;
			width: 1px;
			height: 1px;
			overflow: scroll;
			direction: rtl;
			font-size: 14px;
			">A</div>
			').appendTo('body')
		node = el[0]
		system =
			if (node.scrollLeft > 0)
				'positive'
			else
				node.scrollLeft = 1
				if el.scrollLeft > 0
					'reverse'
				else
					'negative'
		el.remove()
		system

	$ ->
		rtlScrollSystem = detectRtlScrollSystem()
