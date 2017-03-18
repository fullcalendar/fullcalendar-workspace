
class TimelineView extends View

	timeGrid: null # TODO: rename
	isScrolled: false


	initialize: ->
		@timeGrid = @instantiateGrid()
		@intervalDuration = @timeGrid.duration


	instantiateGrid: ->
		new TimelineGrid(this)


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
		@timeGrid.setRange(@renderRange)
		@timeGrid.renderDates()


	unrenderDates: ->
		@timeGrid.unrenderDates()


	# Business Hours
	# ------------------------------------------------------------------------------------------------------------------


	renderBusinessHours: ->
		@timeGrid.renderBusinessHours()


	unrenderBusinessHours: ->
		@timeGrid.unrenderBusinessHours()


	# Now Indicator
	# ------------------------------------------------------------------------------------------------------------------


	getNowIndicatorUnit: ->
		@timeGrid.getNowIndicatorUnit()


	renderNowIndicator: (date) ->
		@timeGrid.renderNowIndicator(date)


	unrenderNowIndicator: ->
		@timeGrid.unrenderNowIndicator()


	# Hit System
	# ---------------------------------------------------------------------------------
	# forward all hit-related method calls to timeGrid


	hitsNeeded: ->
		@timeGrid.hitsNeeded()


	hitsNotNeeded: ->
		@timeGrid.hitsNotNeeded()


	prepareHits: ->
		@timeGrid.prepareHits()


	releaseHits: ->
		@timeGrid.releaseHits()


	queryHit: (leftOffset, topOffset) ->
		@timeGrid.queryHit(leftOffset, topOffset)


	getHitSpan: (hit) ->
		@timeGrid.getHitSpan(hit)


	getHitEl: (hit) ->
		@timeGrid.getHitEl(hit)


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


	computeInitialScroll: ->
		left = 0
		if @timeGrid.isTimeScale
			scrollTime = @opt('scrollTime')
			if scrollTime
				scrollTime = moment.duration(scrollTime)
				left = @timeGrid.dateToCoord(@activeRange.start.clone().time(scrollTime)) # TODO: fix this for RTL
		{ left, top: 0 }


	queryScroll: ->
		{
			left: @timeGrid.bodyScroller.getScrollLeft()
			top: @timeGrid.bodyScroller.getScrollTop()
		}


	setScroll: (scroll) ->
		# TODO: workaround for FF. the ScrollJoiner sibling won't react fast enough
		# to override the native initial crappy scroll that FF applies.
		# TODO: have the ScrollJoiner handle this
		# Similar code in ResourceTimelineView::setScroll
		@timeGrid.headScroller.setScrollLeft(scroll.left)
		@timeGrid.bodyScroller.setScrollLeft(scroll.left)
		@timeGrid.bodyScroller.setScrollTop(scroll.top)


	# Events
	# ---------------------------------------------------------------------------------


	renderEvents: (events) ->
		@timeGrid.renderEvents(events)
		@updateWidth()


	unrenderEvents: ->
		@timeGrid.unrenderEvents()
		@updateWidth()


	renderDrag: (dropLocation, seg) ->
		@timeGrid.renderDrag(dropLocation, seg)


	unrenderDrag: ->
		@timeGrid.unrenderDrag()


	getEventSegs: ->
		@timeGrid.getEventSegs()


	# Selection
	# ---------------------------------------------------------------------------------


	renderSelection: (range) ->
		@timeGrid.renderSelection(range)


	unrenderSelection: ->
		@timeGrid.unrenderSelection()

