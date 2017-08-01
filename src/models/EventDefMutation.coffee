
oldMutateSingle = EventDefMutation::mutateSingle

# either both will be set, or neither will be set
EventDefMutation::oldResourceId = null
EventDefMutation::newResourceId = null


EventDefMutation::mutateSingle = (eventDef) ->
	undo = oldMutateSingle.apply(this, arguments)
	savedResourceIds = null

	if @oldResourceId and eventDef.hasResourceId(@oldResourceId)
		savedResourceIds = eventDef.getResourceIds()
		eventDef.removeResourceId(@oldResourceId)
		eventDef.addResourceId(@newResourceId)

	=> # return value
		undo()

		if savedResourceIds
			eventDef.resourceIds = savedResourceIds
