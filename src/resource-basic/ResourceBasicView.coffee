
class ResourceBasicView extends FC.BasicView

	ResourceViewMixin.mixOver(this)

	dayGridClass: ResourceDayGrid

	constructor: ->
		super
		@initResourceView()


FC.ResourceBasicView = ResourceBasicView
