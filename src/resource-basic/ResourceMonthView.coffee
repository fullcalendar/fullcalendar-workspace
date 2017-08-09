
class ResourceMonthView extends FC.MonthView

	# configuration for View monkeypatch
	baseRenderRequiresResources: true

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResourcesOnGrids: (resources) ->
		@dayGrid.setResources(resources)


	unsetResourcesOnGrids: ->
		@dayGrid.unsetResources()
