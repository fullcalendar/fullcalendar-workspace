
class ResourceMonthView extends FC.MonthView

	@mixin(ResourceViewMixin)

	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()


FC.ResourceMonthView = ResourceMonthView