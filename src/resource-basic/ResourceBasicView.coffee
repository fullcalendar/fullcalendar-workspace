
class ResourceBasicView extends FC.BasicView

	@mixin = Class.mixin
	@mixin(ResourceViewMixin)

	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()


FC.ResourceBasicView = ResourceBasicView
