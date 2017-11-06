
class ResourceMonthView extends FC.MonthView

	@mixin = Class.mixin
	@mixin(ResourceViewMixin)

	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()


FC.ResourceMonthView = ResourceMonthView