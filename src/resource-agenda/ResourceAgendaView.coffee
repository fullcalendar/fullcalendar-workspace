
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


	unsetResources: (isDestroying) ->
		@clearEvents()

		@timeGrid.unsetResources()
		if @dayGrid
			@dayGrid.unsetResources()

		# HACK
		# don't re-render resources if we don't need to
		# solves ResourceManager unbinding bugs
		if not isDestroying
			# TODO: optimize. only redisplay the columns
			@clearView()
			@displayView()
