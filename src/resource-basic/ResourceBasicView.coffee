
class ResourceBasicView extends FC.BasicView

	@mixin ResourceViewMixin

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	renderResources: (resources) ->
		@dayGrid.setResources(resources) # doesn't rerender

		if @isDisplayingDateVisuals
			@displayDateVisuals() # rerenders the whole grid, with resources


	unrenderResources: (isDestroying) ->
		@dayGrid.unsetResources() # doesn't rerender

		# if already rendered, then rerender.
		# otherwise, displayDateVisuals will be called anyway.
		# if in the process of destroying the view, don't bother.
		if not isDestroying and @isDisplayingDateVisuals
			@displayDateVisuals() # rerenders the whole grid, with resources
