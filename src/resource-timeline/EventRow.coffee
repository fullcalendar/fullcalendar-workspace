
class EventRow extends RowParent

	hasOwnRow: true
	segContainerEl: null
	segContainerHeight: null

	innerEl: null
	bgSegContainerEl: null # same thing :(

	isSegsRendered: false # for *fg* segs, but also a proxy for if bg segs were rendered too
	isBusinessHourSegsRendered: false
	businessHourSegs: null
	bgSegs: null
	fgSegs: null


	renderEventContent: (tr) ->
		theme = @view.calendar.theme

		tr.html('
			<td class="' + theme.getClass('widgetContent') + '">
				<div>
					<div class="fc-event-container" />
				</div>
			</td>
		')
		@segContainerEl = tr.find('.fc-event-container')
		@innerEl = @bgSegContainerEl = tr.find('td > div')

		@ensureSegsRendered()


	ensureSegsRendered: ->
		if not @isSegsRendered

			@ensureBusinessHourSegsRendered()

			if @bgSegs
				@view.timeGrid.renderFillInContainer('bgEvent', this, @bgSegs)

			if @fgSegs
				@view.timeGrid.renderFgSegsInContainers([[ this, @fgSegs ]])

			@isSegsRendered = true


	ensureBusinessHourSegsRendered: ->
		if @businessHourSegs and not @isBusinessHourSegsRendered

			# do what TimelineGrid::renderBusinessHours does
			# but call renderFillInContainer directly
			@view.timeGrid.renderFillInContainer('businessHours', this, @businessHourSegs, 'bgevent')

			@isBusinessHourSegsRendered = true


	unrenderEventContent: ->

		# TODO: triggerEventUnrender
		# TODO: remove from Grid::elsByFill{}
		# TODO: ResourceTimelineGrid mimics this same logic :(

		@clearBusinessHourSegs()
		@bgSegs = null
		@fgSegs = null
		@isSegsRendered = false


	clearBusinessHourSegs: ->

		# TODO: remove from Grid::elsByFill{}

		if @businessHourSegs
			for seg in @businessHourSegs
				if seg.el
					seg.el.remove()
			@businessHourSegs = null

		@isBusinessHourSegsRendered = false
