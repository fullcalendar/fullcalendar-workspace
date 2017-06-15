
class ResourceComponentFootprint extends ComponentFootprint

	resourceId: null

	constructor: (unzonedRange, isAllDay, resourceId) ->
		super

		@resourceId = resourceId
