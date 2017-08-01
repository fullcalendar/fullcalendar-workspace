
class ResourceComponentFootprint extends ComponentFootprint

	resourceId: null


	constructor: (unzonedRange, isAllDay, resourceId) ->
		super

		@resourceId = resourceId


	toLegacy: (calendar) ->
		obj = super
		obj.resourceId = @resourceId
		obj
