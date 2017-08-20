
class ResourceAgendaView extends FC.AgendaView

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid


	constructor: ->
		super
		@watchDisplayingDatesAndResources()


	renderHead: ->
		super
		@timeGrid.processHeadResourceEls(@headContainerEl)
