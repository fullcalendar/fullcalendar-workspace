
class ResourceComponentEventRenderer extends EventRenderer

	# only returns the specific single resource for the ResourceComponentFootprint
	getEventFootprintResourceIds: (eventFootprint) ->
		[ eventFootprint.componentFootprint.resourceId ]
