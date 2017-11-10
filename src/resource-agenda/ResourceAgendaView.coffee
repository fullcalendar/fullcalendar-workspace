
class ResourceAgendaView extends FC.AgendaView

	ResourceViewMixin.mixOver(this)

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()


FC.ResourceAgendaView = ResourceAgendaView
