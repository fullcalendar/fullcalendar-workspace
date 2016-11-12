
class ResourceAgendaView extends FC.AgendaView

	@mixin ResourceViewMixin

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@timeGrid.processHeadResourceEls(@headContainerEl)


	renderResources: (resources) ->
		@timeGrid.setResources(resources) # doesn't rerender
		if @dayGrid
			@dayGrid.setResources(resources) # doesn't rerender

		if @isDisplayingDateVisuals
			@displayDateVisuals() # rerenders the whole grid, with resources


	unrenderResources: (isDestroying) ->
		@timeGrid.unsetResources() # doesn't rerender
		if @dayGrid
			@dayGrid.unsetResources() # doesn't rerender

		# if already rendered, then rerender.
		# otherwise, displayDateVisuals will be called anyway.
		# if in the process of destroying the view, don't bother.
		if not isDestroying and @isDisplayingDateVisuals
			@displayDateVisuals() # rerenders the whole grid, with resources
