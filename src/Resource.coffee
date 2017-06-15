
class Resource


Resource.extractIds = (rawProps, calendar) ->
	resourceField = calendar.opt('eventResourceField') or 'resourceId'
	resourceIds = []

	if rawProps.resourceIds
		for rawResourceId in rawProps.resourceIds
			resourceIds.push(Resource.normalizeId(rawResourceId))

	if rawProps[resourceField]?
		resourceId.push(Resource.normalizeId(rawProps[resourceField]))

	resourceIds


Resource.normalizeId = (rawId) ->
	String(rawId)
