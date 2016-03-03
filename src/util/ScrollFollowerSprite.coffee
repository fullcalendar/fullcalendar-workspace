
class ScrollFollowerSprite

	follower: null
	el: null
	absoluteEl: null
	naturalRect: null
	parentRect: null
	containerRect: null
	isEnabled: true # determines whether css position will be assigned. will still calculate position
	isHFollowing: false
	isVFollowing: false
	doAbsolute: false
	isAbsolute: false
	isCentered: false
	rect: null # if null, then completely offscreen
	isBlock: false
	naturalWidth: null


	constructor: (@el, @follower=null) ->
		@isBlock = @el.css('display') == 'block'
		@el.css('position', 'relative')


	disable: ->
		if @isEnabled
			@isEnabled = false
			@resetPosition()
			@unabsolutize()


	enable: ->
		if not @isEnabled
			@isEnabled = true
			@assignPosition()


	clear: ->
		@disable()
		@follower = null
		@absoluteEl = null


	cacheDimensions: ->
		isHFollowing = false
		isVFollowing = false
		isCentered = false

		@naturalWidth = @el.width()

		@resetPosition()
		follower = @follower
		naturalRect = @naturalRect = follower.getBoundingRect(@el)
		parentEl = @el.parent()
		@parentRect = follower.getBoundingRect(parentEl)
		containerRect = @containerRect = joinRects(follower.getContentRect(parentEl), naturalRect)
		minTravel = follower.minTravel

		if follower.containOnNaturalLeft
			containerRect.left = naturalRect.left

		if follower.containOnNaturalRight
			containerRect.right = naturalRect.right

		if follower.isHFollowing
			if getRectWidth(containerRect) - getRectWidth(naturalRect) >= minTravel
				isCentered = @el.css('text-align') is 'center'
				isHFollowing = true

		if follower.isVFollowing
			if getRectHeight(containerRect) - getRectHeight(naturalRect) >= minTravel
				isVFollowing = true

		@isHFollowing = isHFollowing
		@isVFollowing = isVFollowing
		@isCentered = isCentered


	updatePosition: ->
		@computePosition()
		@assignPosition()


	resetPosition: ->
		@el.css
			top: ''
			left: ''


	computePosition: ->
		viewportRect = @follower.viewportRect
		parentRect = @parentRect
		containerRect = @containerRect
		visibleParentRect = intersectRects(viewportRect, parentRect)
		rect = null
		doAbsolute = false

		if visibleParentRect # is parent element onscreen?
			rect = copyRect(@naturalRect)
			subjectRect = intersectRects(rect, parentRect)

			# will we need to reposition?
			if (@isCentered and not testRectContains(viewportRect, parentRect)) or # centering and container not completely in view?
			   (subjectRect and not testRectContains(viewportRect, subjectRect)) # subject not completely in view?

				doAbsolute = true

				if @isHFollowing
					if @isCentered
						rectWidth = getRectWidth(rect)
						rect.left = (visibleParentRect.left + visibleParentRect.right) / 2 - rectWidth / 2
						rect.right = rect.left + rectWidth
					else
						if not hContainRect(rect, viewportRect) # move into view. already there?
							doAbsolute = false

					if hContainRect(rect, containerRect) # move within container. needed to move?
						doAbsolute = false

				if @isVFollowing
					if not vContainRect(rect, viewportRect) # move into view. already there?
						doAbsolute = false

					if vContainRect(rect, containerRect) # move within container. needed to move?
						doAbsolute = false

				if not testRectContains(viewportRect, rect) # partially offscreen?
					doAbsolute = false

		@rect = rect
		@doAbsolute = doAbsolute


	assignPosition: ->
		if @isEnabled

			if not @rect # completely offscreen?
				@unabsolutize()

			else if @doAbsolute and not @follower.isForcedRelative
				@absolutize()
				@absoluteEl.css
					top: @rect.top - @follower.viewportRect.top + @follower.scrollbarWidths.top
					left: @rect.left - @follower.viewportRect.left + @follower.scrollbarWidths.left
					width: if @isBlock then @naturalWidth else ''

			else
				top = @rect.top - @naturalRect.top
				left = @rect.left - @naturalRect.left
				@unabsolutize()
				@el.toggleClass('fc-following', Boolean(top or left))
					.css
						top: top
						left: left


	absolutize: ->
		if not @isAbsolute
			if not @absoluteEl
				@absoluteEl = @buildAbsoluteEl()
			@absoluteEl.appendTo(@follower.scroller.el)
			@el.css('visibility', 'hidden')
			@isAbsolute = true


	unabsolutize: ->
		if @isAbsolute
			@absoluteEl.detach()
			@el.css('visibility', '')
			@isAbsolute = false


	buildAbsoluteEl: -> # TODO: cache this?
		@el.clone().addClass('fc-following').css
			'position': 'absolute'
			'z-index': 1000, # bad, but luckily scoped by .fc-content's z-index
			'font-weight': @el.css('font-weight')
			'font-size': @el.css('font-size')
			'font-family': @el.css('font-family')
			'color': @el.css('color')
			'padding-top': @el.css('padding-top')
			'padding-bottom': @el.css('padding-bottom')
			'padding-left': @el.css('padding-left')
			'padding-right': @el.css('padding-right')
			'pointer-events': 'none'


# Geometry Utils
# ----------------------------------------------------------------------------------------------------------------------
# TODO: move somewhere more common


copyRect = (rect) ->
	{ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }


getRectWidth = (rect) ->
	rect.right - rect.left


getRectHeight = (rect) ->
	rect.bottom - rect.top


testRectContains = (rect, innerRect) ->
	testRectHContains(rect, innerRect) and testRectVContains(rect, innerRect)


testRectHContains = (rect, innerRect) ->
	innerRect.left >= rect.left and innerRect.right <= rect.right


testRectVContains = (rect, innerRect) ->
	innerRect.top >= rect.top and innerRect.bottom <= rect.bottom


hContainRect = (rect, outerRect) -> # returns true if it had to modify rect
	if rect.left < outerRect.left
		rect.right = outerRect.left + getRectWidth(rect)
		rect.left = outerRect.left
		true
	else if rect.right > outerRect.right
		rect.left = outerRect.right - getRectWidth(rect)
		rect.right = outerRect.right
		true
	else
		false


vContainRect = (rect, outerRect) -> # returns true if it had to modify rect
	if rect.top < outerRect.top
		rect.bottom = outerRect.top + getRectHeight(rect)
		rect.top = outerRect.top
		true
	else if rect.bottom > outerRect.bottom
		rect.top = outerRect.bottom - getRectHeight(rect)
		rect.bottom = outerRect.bottom
		true
	else
		false


joinRects = (rect1, rect2) ->
	{
		left: Math.min(rect1.left, rect2.left)
		right: Math.max(rect1.right, rect2.right)
		top: Math.min(rect1.top, rect2.top)
		bottom: Math.max(rect1.bottom, rect2.bottom)
	}
