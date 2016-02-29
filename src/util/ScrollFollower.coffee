
class ScrollFollower

	scroller: null
	scrollbarWidths: null
	sprites: null
	viewportRect: null # relative to content pane
	contentOffset: null
	isHFollowing: true
	isVFollowing: false

	containOnNaturalLeft: false
	containOnNaturalRight: false
	shouldRequeryDimensions: false
	minTravel: 0 # set by the caller

	isForcedAbsolute: false
	isForcedRelative: false


	constructor: (scroller) ->
		@scroller = scroller
		@sprites = []

		scroller.on 'scrollStart', =>
			if @shouldRequeryDimensions
				@cacheDimensions()

		scroller.on 'scroll', =>
			left = scroller.getScrollFromLeft()
			top = scroller.getScrollTop()
			@viewportRect =
				left: left
				right: left + scroller.getClientWidth()
				top: top
				bottom: top + scroller.getClientHeight()

			@updatePositions()


	# TODO: have a destroy method.
	# View's whose skeletons get destroyed should unregister their scrollfollowers.


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


	cacheDimensions: ->
		scroller = @scroller
		left = scroller.getScrollFromLeft()
		top = scroller.getScrollTop()

		# TODO: use getViewportRect() for getting this rect
		# TODO: make this more DRY. also in constructor. updateViewportRect
		@viewportRect =
			left: left
			right: left + scroller.getClientWidth()
			top: top
			bottom: top + scroller.getClientHeight()

		@scrollbarWidths = scroller.getScrollbarWidths()
		@contentOffset = scroller.canvas.el.offset()

		for sprite in @sprites
			sprite.cacheDimensions()
		return


	forceAbsolute: ->
		@isForcedAbsolute = true
		for sprite in @sprites
			if not sprite.doAbsolute
				sprite.assignPosition()


	forceRelative: ->
		@isForcedRelative = true
		for sprite in @sprites
			if sprite.doAbsolute
				sprite.assignPosition()


	clearForce: ->
		@isForcedRelative = false
		@isForcedAbsolute = false
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
