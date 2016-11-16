
class ResourceBasicView extends FC.BasicView

	# we don't use the render-queue, but many other utils are useful
	@mixin ResourceViewMixin

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@dayGrid.setResources(resources) # doesn't rerender

		if @isDateRendered
			@requestRerenderDate() # rerenders the whole grid, with resources
		else
			Promise.resolve()


	unsetResources: (isDestroying) ->
		@dayGrid.unsetResources() # doesn't rerender

		# if already rendered, then rerender.
		# otherwise, requestRerenderDate will be called anyway.
		# if in the process of destroying the view, don't bother.
		if not isDestroying and @isDateRendered
			@requestRerenderDate() # rerenders the whole grid, with resources
		else
			Promise.resolve()


	# don't block event render nor the 'viewRender' trigger on resource rendering.
	# resources will render on their own time, causing a full requestRerenderDate.
	ensureRenderResources: ->
		Promise.resolve()
