
class ResourceAgendaView extends FC.AgendaView

	@mixin ResourceViewMixin

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@timeGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@timeGrid.setResources(resources)
		if @dayGrid
			@dayGrid.setResources(resources)

		# TODO: optimize. only redisplay the columns
		@clearView()
		@displayView()


	unsetResources: ->
		@clearEvents()

		@timeGrid.unsetResources()
		if @dayGrid
			@dayGrid.unsetResources()

		# TODO: optimize. only redisplay the columns
		@clearView()
		@displayView()
