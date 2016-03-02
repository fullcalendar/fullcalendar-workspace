
# TODO: somehow make more DRY with ResourceBasicView

class ResourceMonthView extends FC.MonthView

	@mixin ResourceViewMixin

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@dayGrid.setResources(resources)

		# TODO: optimize. only redisplay the columns
		@clearView()
		@displayView()


	unsetResources: ->
		@clearEvents()

		@dayGrid.unsetResources()

		# TODO: optimize. only redisplay the columns
		@clearView()
		@displayView()
