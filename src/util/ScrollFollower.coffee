
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
	minTravel: 0

	isForcedAbsolute: false
	isForcedRelative: false


	constructor: (@scroller) ->
		@sprites = []

		@scroller.on 'scrollStart', =>
			if @shouldRequeryDimensions
				@cacheDimensions()

		@scroller.on 'scroll', (scrollTop, scrollLeft) => # todo: switch order
			scrollEl = @scroller.scrollEl

			left = getScrollFromLeft(scrollEl)
			top = scrollEl.scrollTop()
			@viewportRect =
				left: left
				right: left + scrollEl[0].clientWidth
				top: top
				bottom: top + scrollEl[0].clientHeight

			@updatePositions()


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


	cacheDimensions: -> # cacheBounds  cacheRects
		scrollEl = @scroller.scrollEl

		left = getScrollFromLeft(scrollEl)
		top = scrollEl.scrollTop()

		@viewportRect =
			left: left
			right: left + scrollEl[0].clientWidth
			top: top
			bottom: top + scrollEl[0].clientHeight

		# TODO: getViewportRect(el)
		# TODO: updateViewportRect(el)

		@scrollbarWidths = @scroller.getScrollbarWidths()

		# TODO: call scrollinneroffset???
		@contentOffset = @scroller.innerEl.offset()
		##@scroller.contentEl.offset()

		for sprite in @sprites
			sprite.cacheDimensions()
		return


	forceAbsolute: ->
		@isForcedAbsolute = true
		for sprite in @sprites
			if not sprite.doAbsolute # needless opimization?
				sprite.assignPosition()


	forceRelative: ->
		@isForcedRelative = true
		for sprite in @sprites
			if sprite.doAbsolute # needless opimization?
				sprite.assignPosition()


	clearForce: ->
		@isForcedRelative = false
		@isForcedAbsolute = false
		for sprite in @sprites
			sprite.assignPosition()


	update: ->
		@cacheDimensions()
		@updatePositions()


	updatePositions: -> # TODO: break apart!!!
		for sprite in @sprites
			sprite.updatePosition()
		return


	getContentRect: (el) -> # relative to inner content pane # TODO: use getContentRect from utils
		res = el.offset()
		left = res.left + parseFloat(el.css('border-left-width')) + parseFloat(el.css('padding-left')) - @contentOffset.left
		top = res.top + parseFloat(el.css('border-left-width')) + parseFloat(el.css('padding-left')) - @contentOffset.top
		{
			left: left
			right: left + el.width()
			top: top
			bottom: top + el.height()
		}

	getBoundingRect: (el) -> # relative to inner content pane # TODO: use getOuterRect from utils
		res = el.offset()
		left = res.left - @contentOffset.left
		top = res.top - @contentOffset.top
		{
			left: left
			right: left + el.outerWidth()
			top: top
			bottom: top + el.outerHeight()
		}


	# TODO: make the above things generic utilities!
