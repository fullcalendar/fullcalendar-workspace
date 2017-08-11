
# references to pre-monkeypatched methods
ExternalDropping_computeExternalDrop = ExternalDropping::computeExternalDrop


ExternalDropping::computeExternalDrop = (componentFootprint, meta) ->
	eventDef = ExternalDropping_computeExternalDrop.apply(this, arguments)

	if componentFootprint.resourceId
		eventDef.addResourceId(componentFootprint.resourceId)

	eventDef
