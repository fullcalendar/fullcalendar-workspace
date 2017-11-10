
class ResourceMonthView extends FC.MonthView

	ResourceViewMixin.mixOver(this)

	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()


FC.ResourceMonthView = ResourceMonthView