
class Scroller # ScrollPane ?

	el: null
	innerEl: null
	contentEl: null
	bgEl: null
	overflowX: null
	overflowY: null
	isScrolling: false
	handlers: null


	###
	'hidden', 'scroll', 'invisible-scroll', 'auto'
	'visible' not allowed
	TODO: on resize, redo!
	###


	constructor: (@overflowX='auto', @overflowY='auto') ->
		@el = $('
			<div class="fc-scrollpane">
				<div>
					<div class="fc-scrollpane-inner">
						<div class="fc-content"/>
						<div class="fc-bg"/>
					</div>
				</div>
			</div>
		')
		@scrollEl = @el.children()
		@innerEl = @scrollEl.children()
		@contentEl = @innerEl.find('.fc-content')
		@bgEl = @innerEl.find('.fc-bg')

		@scrollEl
			.on 'scroll', proxy(this, 'handleScroll')
			.on 'scroll', debounce(proxy(this, 'handleScrollStop'), 100)

		@handlers = {}
		@gutters = {}


	update: -> # how does this relate to updateCss???
		scrollEl = @scrollEl
		overflowX = @overflowX
		overflowY = @overflowY
		isInvisibleScrollX = overflowX is 'invisible-scroll'
		isInvisibleScrollY = overflowY is 'invisible-scroll'

		#scrollEl.toggleClass(
		#	'fc-no-scrollbars'
		#	(overflowX is 'invisible-scroll' or overflowY is 'invisible-scroll') and
		#		not hasAnyScrollbars(scrollEl)
		#)

		scrollEl.css
			overflowX: if isInvisibleScrollX then 'scroll' else overflowX
			overflowY: if isInvisibleScrollY then 'scroll' else overflowY

		cssProps = { marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 }

		if isInvisibleScrollX or isInvisibleScrollY
			scrollbarWidths = getScrollbarWidths(scrollEl)

			if isInvisibleScrollX
				cssProps.marginTop = -scrollbarWidths.top
				cssProps.marginBottom = -scrollbarWidths.bottom

			if isInvisibleScrollY
				cssProps.marginLeft = -scrollbarWidths.left
				cssProps.marginRight = -scrollbarWidths.right

		scrollEl.css(cssProps)


	getScrollbarWidths: ->
		scrollbarWidths = getScrollbarWidths(@scrollEl)

		if @overflowX is 'invisible-scroll'
			scrollbarWidths.top = 0
			scrollbarWidths.bottom = 0

		if @overflowY is 'invisible-scroll'
			scrollbarWidths.left = 0
			scrollbarWidths.right = 0

		scrollbarWidths


	handleScroll: ->
		if not @isScrolling
			@isScrolling = true
			@trigger('scrollStart')
		@trigger('scroll', @scrollEl.scrollTop(), @scrollEl.scrollLeft()) # TODO: reverse arg order


	handleScrollStop: ->
		@isScrolling = false
		@trigger('scrollStop')


	height: null
	contentWidth: null
	contentMinWidth: null
	gutters: null


	setHeight: (@height) ->
		@updateCss()

	getHeight: ->
		@height ? @scrollEl.height()

	setContentWidth: (@contentWidth) ->
		@updateCss() #optimize?

	setContentMinWidth: (@contentMinWidth) ->
		@updateCss() #contentMinWidth

	setGutters: (gutters) ->

		if not gutters
			@gutters = {}
		else
			$.extend(@gutters, gutters)

		@updateCss() #optimize?

	updateCss: ->
		@scrollEl.height(@height)
		gutters = @gutters

		@innerEl.css # is border-box

			width:
				if @contentWidth
					@contentWidth + (gutters.left or 0) + (gutters.right or 0)
				else
					''

			minWidth:
				if @contentMinWidth
					@contentMinWidth + (gutters.left or 0) + (gutters.right or 0)

			paddingLeft: gutters.left or ''
			paddingRight: gutters.right or ''
			paddingTop: gutters.top or ''
			paddingBottom: gutters.bottom or ''

		@bgEl.css
			left: gutters.left or ''
			right: gutters.right or ''
			top: gutters.top or ''
			bottom: gutters.bottom or ''

	append: (content) ->
		@contentEl.append(content)

	scrollTop: (top) ->
		@scrollEl.scrollTop(top)

	scrollLeft: (left) ->
		@scrollEl.scrollLeft(left)



	# PubSub
	# ---------------------------------------------------------------------------------


	on: (handlerName, handler) ->
		(@handlers[handlerName] or= []).push(handler)
		this # for chaining


	trigger: (handlerName, args...) ->
		for handler in (@handlers[handlerName] or [])
			handler.apply(this, args)
		return


hasAnyScrollbars = (el) ->
	scrollbarWidths = getScrollbarWidths(el)
	scrollbarWidths.left or scrollbarWidths.right or scrollbarWidths.top or scrollbarWidths.bottom
