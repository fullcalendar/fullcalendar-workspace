
class EventRow extends RowParent

	fillRendererClass: TimelineFillRenderer
	eventRendererClass: TimelineEventRenderer
	helperRendererClass: TimelineHelperRenderer
	businessHourRendererClass: BusinessHourRenderer

	hasOwnRow: true
	segContainerEl: null # for EventRenderer
	segContainerHeight: null

	innerEl: null
	bgSegContainerEl: null # for EventRenderer. same el as innerEl :(


	renderEventSkeleton: (tr) ->
		tr.html('
			<td class="' + @view.widgetContentClass + '">
				<div>
					<div class="fc-event-container" />
				</div>
			</td>
		')
		@segContainerEl = tr.find('.fc-event-container')
		@innerEl = @bgSegContainerEl = tr.find('td > div')


	rangeToCoords: (range) ->
		@view.rangeToCoords(range)


	componentFootprintToSegs: (componentFootprint) ->
		@view.componentFootprintToSegs(componentFootprint)
