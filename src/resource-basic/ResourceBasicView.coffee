
class ResourceBasicView extends FC.BasicView

	@mixin(ResourceViewMixin)

	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()
