
class ResourceBasicView extends FC.BasicView

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResourcesOnGrids: (resources) ->
		@dayGrid.setResources(resources)


	unsetResourcesOnGrids: ->
		@dayGrid.unsetResources()
