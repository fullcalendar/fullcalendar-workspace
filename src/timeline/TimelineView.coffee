
class TimelineView extends View

	timelineGrid: null
	isScrolled: false
	usesMinMaxTime: true # indicates that minTime/maxTime affects rendering


	constructor: ->
		super
		@timelineGrid = @instantiateGrid()
		@addChild(@timelineGrid)


	instantiateGrid: ->
		new TimelineGrid(this)


	getFallbackDuration: ->
		@timelineGrid.computeFallbackDuration()


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
		@timelineGrid.headEl = @el.find('thead .fc-time-area')
		@timelineGrid.setElement(@el.find('tbody .fc-time-area')) # will renderSkeleton

		@isScrolled = false # because if the grid has been rerendered, it will get a zero scroll
		@timelineGrid.bodyScroller.on('scroll', proxy(this, 'handleBodyScroll'))


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
		@timelineGrid.removeElement()
		@handleBodyScroll(0)
		super


	# Now Indicator
	# ------------------------------------------------------------------------------------------------------------------


	getNowIndicatorUnit: ->
		@timelineGrid.getNowIndicatorUnit()


	# Sizing
	# ---------------------------------------------------------------------------------


	updateSize: (totalHeight, isAuto, isResize) ->
		if isAuto
			bodyHeight = 'auto'
		else
			bodyHeight = totalHeight - @timelineGrid.headHeight() - @queryMiscHeight()

		@timelineGrid.bodyScroller.setHeight(bodyHeight)

		# do children AFTER because of ScrollFollowerSprite abs position issues
		super


	queryMiscHeight: ->
		@el.outerHeight() -
			@timelineGrid.headScroller.el.outerHeight() -
			@timelineGrid.bodyScroller.el.outerHeight()


	# Scrolling
	# ---------------------------------------------------------------------------------


	computeInitialDateScroll: ->
		unzonedRange = @get('dateProfile').activeUnzonedRange
		left = 0
		if @timelineGrid.isTimeScale
			scrollTime = @opt('scrollTime')
			if scrollTime
				scrollTime = moment.duration(scrollTime)
				left = @timelineGrid.dateToCoord(unzonedRange.getStart().time(scrollTime)) # TODO: fix this for RTL
		{ left }


	queryDateScroll: ->
		{ left: @timelineGrid.bodyScroller.getScrollLeft() }


	applyDateScroll: (scroll) ->
		if scroll.left?
			# TODO: workaround for FF. the ScrollJoiner sibling won't react fast enough
			# to override the native initial crappy scroll that FF applies.
			# TODO: have the ScrollJoiner handle this
			# Similar code in ResourceTimelineView::setScroll
			@timelineGrid.headScroller.setScrollLeft(scroll.left)
			@timelineGrid.bodyScroller.setScrollLeft(scroll.left)


# Modify "base" tasks
# ----------------------------------------------------------------------------------------------------------------------

# fire viewRender/viewDestroy when dates are rendered AND resources have been bound.
# does NOT refire when resources are dynamically added/removed.
TimelineView.watch 'displayingBase', [ 'dateProfile', 'hasResources' ], (deps) ->
	@requestRender(@processLicenseKey)
	@whenSizeUpdated(@triggerBaseRendered)
, ->
	@triggerBaseUnrendered()
