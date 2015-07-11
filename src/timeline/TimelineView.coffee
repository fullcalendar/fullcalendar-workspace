
class TimelineView extends View

	timeGrid: null # TODO: rename!!!!!!
	isScrolled: false


	initialize: ->
		@timeGrid = @instantiateGrid()
		@intervalDuration = @timeGrid.duration
		@coordMap = @timeGrid.coordMap # TODO: constrain by scroll panel!!!! (make part of panel system?)


	instantiateGrid: ->
		new TimelineGrid(this)


	setRange: (range) ->
		super
		@timeGrid.setRange(range)


	# Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderSkeleton: ->
		@el.addClass('fc-timeline')

		if @opt('eventOverlap') == false # best way to get option?
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
		@timeGrid.headEl = @el.find('thead .fc-time-area') # TODO: better
		@timeGrid.renderSkeleton()
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
		@timeGrid.unrenderDates() # wish this was called by removeElement


	renderBusinessHours: ->
		@timeGrid.renderBusinessHours()


	unrenderBusinessHours: -> # TODO: way to get around this!?
		@timeGrid.unrenderBusinessHours()


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


	computeInitialScroll: (prevScrollState) ->
		@timeGrid.computeInitialScroll(prevScrollState)


	queryScroll: ->
		@timeGrid.queryScroll()


	setScroll: (state) ->
		@timeGrid.setScroll(state)


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

