
class ResourceExternalDropping extends ExternalDropping


	computeExternalDrop: (resourceComponentFootprint, meta) ->
		eventDef = super
		eventDef.addResourceId(resourceComponentFootprint.resourceId)
		eventDef
