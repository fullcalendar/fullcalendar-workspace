
class ResourceAgendaView extends FC.AgendaView

	# we don't use the render-queue, but many other utils are useful
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

		@isResourcesSet = true

		if @isDateRendered
			@requestRerenderDate() # rerenders the whole grid, with resources
		else
			Promise.resolve()


	unsetResources: (isDestroying) ->
		@timeGrid.unsetResources() # doesn't rerender
		if @dayGrid
			@dayGrid.unsetResources() # doesn't rerender

		@isResourcesSet = true

		# if already rendered, then rerender.
		# otherwise, requestRerenderDate will be called anyway.
		# if in the process of destroying the view, don't bother.
		if not isDestroying and @isDateRendered
			@requestRerenderDate() # rerenders the whole grid, with resources
		else
			Promise.resolve()


	triggerDateRender: ->
		if @isResourcesSet
			View::triggerDateRender.apply(this, arguments)


	resolveEventRenderDeps: ->
		Promise.resolve()
