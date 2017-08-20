
class ResourceBasicView extends FC.BasicView

	dayGridClass: ResourceDayGrid


	constructor: ->
		super
		@watchDisplayingDatesAndResources()


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)
