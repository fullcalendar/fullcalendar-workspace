
class TimelineView extends View

	timeGrid: null # TODO: rename
	isScrolled: false
	usesMinMaxTime: true # indicates that minTime/maxTime affects rendering


	initialize: ->
		@timeGrid = @instantiateGrid()
		@addChild(@timeGrid)


	instantiateGrid: ->
		new TimelineGrid(this)


	setDateProfileForRendering: (dateProfile) ->
		super
		@timeGrid.initScaleProps()
		@timeGrid.setRange(@renderRange)


	getFallbackDuration: ->
		@timeGrid.computeFallbackDuration()


	# Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderSkeleton: ->
		@el.addClass('fc-timeline')

		if @opt('eventOverlap') == false
			@el.addClass('fc-no-overlap')

		@el.html(@renderSkeletonHtml())
		@renderTimeGridSkeleton()


	renderSkeletonHtml: ->
		'<table>
			<thead class="fc-head">
				<tr>
					<td class="fc-time-area ' + @widgetHeaderClass + '"></td>
				</tr>
			</thead>
			<tbody class="fc-body">
				<tr>
					<td class="fc-time-area ' + @widgetContentClass + '"></td>
				</tr>
			</tbody>
		</table>'


	renderTimeGridSkeleton: ->
		@timeGrid.setElement(@el.find('tbody .fc-time-area'))
		@timeGrid.headEl = @el.find('thead .fc-time-area')
		@timeGrid.renderSkeleton()
		@isScrolled = false # because if the grid has been rerendered, it will get a zero scroll
		@timeGrid.bodyScroller.on('scroll', proxy(this, 'handleBodyScroll'))


	handleBodyScroll: (top, left) ->
		if top
			if not @isScrolled
				@isScrolled = true
				@el.addClass('fc-scrolled')
		else
			if @isScrolled
				@isScrolled = false
				@el.removeClass('fc-scrolled')


	unrenderSkeleton: ->
		@timeGrid.removeElement()
		@handleBodyScroll(0)
		super


	renderDates: ->
		@timeGrid.renderDates()


	unrenderDates: ->
		@timeGrid.unrenderDates()


	# Now Indicator
	# ------------------------------------------------------------------------------------------------------------------


	getNowIndicatorUnit: ->
		@timeGrid.getNowIndicatorUnit()


	# Sizing
	# ---------------------------------------------------------------------------------


	# NOTE: this is called a lot when "width" doesn't seem directly involved :(
	updateWidth: ->
		@timeGrid.updateWidth()


	setHeight: (totalHeight, isAuto) ->
		if isAuto
			bodyHeight = 'auto'
		else
			bodyHeight = totalHeight - @timeGrid.headHeight() - @queryMiscHeight()

		@timeGrid.bodyScroller.setHeight(bodyHeight)


	queryMiscHeight: ->
		@el.outerHeight() -
			@timeGrid.headScroller.el.outerHeight() -
			@timeGrid.bodyScroller.el.outerHeight()


	# Scrolling
	# ---------------------------------------------------------------------------------


	computeInitialDateScroll: ->
		left = 0
		if @timeGrid.isTimeScale
			scrollTime = @opt('scrollTime')
			if scrollTime
				scrollTime = moment.duration(scrollTime)
				left = @timeGrid.dateToCoord(@activeRange.start.clone().time(scrollTime)) # TODO: fix this for RTL
		{ left }


	queryDateScroll: ->
		{ left: @timeGrid.bodyScroller.getScrollLeft() }


	applyDateScroll: (scroll) ->
		if scroll.left?
			# TODO: workaround for FF. the ScrollJoiner sibling won't react fast enough
			# to override the native initial crappy scroll that FF applies.
			# TODO: have the ScrollJoiner handle this
			# Similar code in ResourceTimelineView::setScroll
			@timeGrid.headScroller.setScrollLeft(scroll.left)
			@timeGrid.bodyScroller.setScrollLeft(scroll.left)


	# Events
	# ---------------------------------------------------------------------------------


	renderEventsPayload: (eventsPayload) ->
		@timeGrid.renderEventsPayload(eventsPayload)
		@updateWidth() # could rely on ChronoComponent entirely if not for this line


	unrenderEvents: ->
		@timeGrid.unrenderEvents()
		@updateWidth() # could rely on ChronoComponent entirely if not for this line

