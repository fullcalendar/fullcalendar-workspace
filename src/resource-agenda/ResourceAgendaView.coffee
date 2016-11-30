
class ResourceAgendaView extends FC.AgendaView

	# we don't use the render-queue, but many other utils are useful
	@mixin ResourceViewMixin

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@timeGrid.processHeadResourceEls(@headContainerEl)


	triggerDateRender: ->
		if @isResourcesSet # wait for a requestDateRender that has resource data
			View::triggerDateRender.apply(this, arguments)


	forceEventsRender: (events) ->
		# don't impose any resource dependencies.
		# allow events to render even if resources haven't arrive yet.
		View::forceEventsRender.call(this, events)


	forceResourcesRender: (resources) ->
		@timeGrid.setResources(resources) # doesn't rerender
		if @dayGrid
			@dayGrid.setResources(resources) # doesn't rerender

		if @isDateRendered
			@requestDateRender().then => # rerenders the whole grid, with resources
				@afterResourcesRender()
		else
			Promise.resolve()


	forceResourcesUnrender: (teardownOptions={}) ->
		@timeGrid.unsetResources() # doesn't rerender
		if @dayGrid
			@dayGrid.unsetResources() # doesn't rerender

		if @isDateRendered and not teardownOptions.skipRerender
			@requestDateRender().then => # rerenders the whole grid, with resources
				@afterResourcesUnrender()
		else
			Promise.resolve()
