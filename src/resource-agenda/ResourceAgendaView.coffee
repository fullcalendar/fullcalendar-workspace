
class ResourceAgendaView extends FC.AgendaView

	@mixin ResourceViewMixin

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@timeGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@timeGrid.setResources(resources) # doesn't rerender
		if @dayGrid
			@dayGrid.setResources(resources) # doesn't rerender

		if @isDisplayingDateVisuals
			@displayDateVisuals() # rerenders the whole grid, with resources


	unsetResources: ->
		@timeGrid.unsetResources()
		if @dayGrid
			@dayGrid.unsetResources()

		# HACK: don't need to unrender because unsetEvents is never called
		# without the view subsequently being removed.
