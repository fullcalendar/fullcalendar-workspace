
class ResourceBasicView extends FC.BasicView

	# configuration for monkeypatched View
	baseRenderRequiresResources: true

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResourcesOnGrids: (resources) ->
		@dayGrid.setResources(resources)


	unsetResourcesOnGrids: ->
		@dayGrid.unsetResources()
