
class ScrollFollower

	scroller: null
	scrollbarWidths: null
	sprites: null
	viewportRect: null # relative to content pane
	contentOffset: null
	isHFollowing: true
	isVFollowing: false

	allowPointerEvents: false

	containOnNaturalLeft: false
	containOnNaturalRight: false
	minTravel: 0 # set by the caller

	# TODO: improve
	isTouch: false
	isForcedRelative: false


	constructor: (scroller, @allowPointerEvents=false) ->
		@scroller = scroller
		@sprites = []

		scroller.on 'scroll', =>
			if scroller.isTouchedEver
				# touch devices should only updated after the scroll is over
				@isTouch = true
				@isForcedRelative = true # touch devices scroll too quick to make absolute ever look good
			else
				@isTouch = false
				#@isForcedRelative = false # why
				@handleScroll()

		# for touch devices
		scroller.on 'scrollEnd', =>
			@handleScroll()


	# TODO: have a destroy method.
	# View's whose skeletons get destroyed should unregister their scrollfollowers.

	###
	Can specify sprites as a jQuery set of elements.
	If elements are already position:relative, is a performance benefit.
	###
	setSprites: (sprites) ->
		@clearSprites()

		if sprites instanceof $
			@sprites = for sprite in sprites
				new ScrollFollowerSprite($(sprite), this)
		else
			for sprite in sprites
				sprite.follower = this
			@sprites = sprites


	clearSprites: ->
		for sprite in @sprites
			sprite.clear()
		@sprites = []


	handleScroll: ->
		@updateViewport()
		@updatePositions()


	cacheDimensions: ->
		@updateViewport()

		@scrollbarWidths = @scroller.getScrollbarWidths()
		@contentOffset = @scroller.canvas.el.offset()

		for sprite in @sprites
			sprite.cacheDimensions()
		return


	updateViewport: ->
		scroller = @scroller
		left = scroller.getScrollFromLeft()
		top = scroller.getScrollTop()

		# TODO: use getViewportRect() for getting this rect
		@viewportRect =
			left: left
			right: left + scroller.getClientWidth()
			top: top
			bottom: top + scroller.getClientHeight()


	forceRelative: ->
		if not @isForcedRelative
			@isForcedRelative = true
			for sprite in @sprites
				if sprite.doAbsolute
					sprite.assignPosition()


	clearForce: ->
		if @isForcedRelative and not @isTouch # don't allow touch to ever NOT be relative
			@isForcedRelative = false
			for sprite in @sprites
				sprite.assignPosition()


	update: ->
		@cacheDimensions()
		@updatePositions()


	updatePositions: ->
		for sprite in @sprites
			sprite.updatePosition()
		return


	# relative to inner content pane
	getContentRect: (el) ->
		getContentRect(el, @contentOffset)


	# relative to inner content pane
	getBoundingRect: (el) ->
		getOuterRect(el, @contentOffset)
