
class ResourceBasicView extends FC.BasicView

	# we don't use the render-queue, but many other utils are useful
	@mixin ResourceViewMixin

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@dayGrid.setResources(resources) # doesn't rerender

		@isResourcesSet = true

		if @isDateRendered
			@requestRerenderDate() # rerenders the whole grid, with resources
		else
			Promise.resolve()


	unsetResources: (isDestroying) ->
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
