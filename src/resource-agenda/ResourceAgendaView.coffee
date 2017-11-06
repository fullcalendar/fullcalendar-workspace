
class ResourceAgendaView extends FC.AgendaView

	@mixin = Class.mixin
	@mixin(ResourceViewMixin)

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()


FC.ResourceAgendaView = ResourceAgendaView
