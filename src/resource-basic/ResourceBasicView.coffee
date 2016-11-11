
class ResourceBasicView extends FC.BasicView

	@mixin ResourceViewMixin

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@dayGrid.setResources(resources) # doesn't rerender

		if @isDisplayingDateVisuals
			@displayDateVisuals() # rerenders the whole grid, with resources


	unsetResources: ->
		@dayGrid.unsetResources()

		# HACK: don't need to unrender because unsetEvents is never called
		# without the view subsequently being removed.
