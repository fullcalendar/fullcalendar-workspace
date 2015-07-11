
class EventRow extends RowParent

	hasOwnRow: true
	segContainerEl: null
	segContainerHeight: null

	innerEl: null
	bgSegContainerEl: null # same thing :(

	isSegsRendered: false # for *fg* segs, but also a proxy for if bg segs were rendered too
	bgSegs: null
	fgSegs: null


	renderEventContent: (tr) ->
		tr.html('
			<td class="' + @view.widgetContentClass + '">
				<div>
					<div class="fc-event-container" />
				</div>
			</td>
		')
		@segContainerEl = tr.find('.fc-event-container')
		@innerEl = @bgSegContainerEl = tr.find('td > div')

		if not @isSegsRendered

			if @bgSegs
				@view.timeGrid.renderFillInContainer('bgEvent', this, @bgSegs)

			if @fgSegs
				@view.timeGrid.renderFgSegsInContainers([[ this, @fgSegs ]])

			@isSegsRendered = true


	unrenderEventContent: ->

		# TODO: triggerEventUnrender
		# TODO: remove from Grid::elsByFill{}
		#if @isSegsRendered # only this specific row is being killed. global events still intact

		@bgSegs = null
		@fgSegs = null
		@isSegsRendered = false


	# THESE dont really apply anymore. to *all*
	# triggerEventRender
	# triggerEventUnrender