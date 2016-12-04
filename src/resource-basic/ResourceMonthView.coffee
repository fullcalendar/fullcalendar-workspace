
class ResourceMonthView extends FC.MonthView

	@mixin VertResourceViewMixin

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResourcesOnGrids: (resources) ->
		@dayGrid.setResources(resources)


	unsetResourcesOnGrids: ->
		@dayGrid.unsetResources()
