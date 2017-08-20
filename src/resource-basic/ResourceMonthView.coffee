
class ResourceMonthView extends FC.MonthView

	dayGridClass: ResourceDayGrid


	constructor: ->
		super
		@watchDisplayingDatesAndResources()


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)
