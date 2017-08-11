
class EventRow extends RowParent

	fillRendererClass: TimelineGridFillRenderer
	eventRendererClass: TimelineGridEventRenderer
	helperRendererClass: TimelineGridHelperRenderer

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
		@view.timelineGrid.rangeToCoords(range)


	componentFootprintToSegs: (componentFootprint) ->
		@view.timelineGrid.componentFootprintToSegs(componentFootprint)


# Watcher Garbage
# ---------------------------------------------------------------------------------------------------------------------

###
+ isInDom (why isn't already in DOM!?)
- hasResources / displayingResources (does not render it's own resourceS nor receive them)
###
EventRow::watchDisplayingEvents = ->
	@watch 'displayingEvents', [ # overrides previous 'displayingEvents' definition
		'isInDom'
		'hasEvents'
	], =>
		@requestRender(@executeEventsRender, [ @get('currentEvents') ], 'event', 'init')
	, =>
		@requestRender(@executeEventsUnrender, null, 'event', 'destroy')
