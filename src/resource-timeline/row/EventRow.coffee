
class EventRow extends RowParent

	hasOwnRow: true
	segContainerEl: null # for EventRenderer
	segContainerHeight: null

	innerEl: null
	bgSegContainerEl: null # for EventRenderer. same el as innerEl :(


	constructor: ->
		super

		# TODO: better way of instantiating these?

		@fillRenderer = new TimelineGridFillRenderer(
			@view.timelineGrid
			this # { bgSegContainerEl }
		)

		@eventRenderer = new TimelineGridEventRenderer(
			@view.timelineGrid
			@fillRenderer
			this # { segContainerEl, segContainerHeight }
		)

		@helperRenderer = new TimelineGridHelperRenderer(
			@view.timelineGrid
			@eventRenderer
			this
		)


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
