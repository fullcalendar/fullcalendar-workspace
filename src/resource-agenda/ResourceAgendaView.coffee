
class ResourceAgendaView extends FC.AgendaView

	@mixin VertResourceViewMixin

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@timeGrid.processHeadResourceEls(@headContainerEl)


	setResourcesOnGrids: (resources) ->
		@timeGrid.setResources(resources)
		if @dayGrid
			@dayGrid.setResources(resources)


	unsetResourcesOnGrids: ->
		@timeGrid.unsetResources()
		if @dayGrid
			@dayGrid.unsetResources()
