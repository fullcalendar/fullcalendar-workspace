
class ResourceEventDefMutation extends EventDefMutation

	oldResourceId: null
	newResourceId: null


	mutateSingle: (eventDef) ->
		undo = super
		savedResourceIds = null

		if @oldResourceId and eventDef.hasResourceId(@oldResourceId)
			savedResourceIds = eventDef.getResourceIds()
			eventDef.removeResourceId(@oldResourceId)
			eventDef.addResourceId(@newResourceId)

			-> # return value (undo function)
				undo()

				if savedResourceIds
					eventDef.resourceIds = savedResourceIds
		else
			undo
