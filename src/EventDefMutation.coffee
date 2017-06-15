
oldMutateSingle = EventDefMutation::mutateSingle

# either both will be set, or neither will be set
EventDefMutation::oldResourceId = null
EventDefMutation::newResourceId = null


EventDefMutation::mutateSingle = (eventDef) ->
	undo = oldMutateSingle.apply(this, arguments)
	isAffected = @oldResourceId and eventDef.hasResourceId(@oldResourceId)

	if isAffected
		eventDef.removeResourceId(@oldResourceId)
		eventDef.addResourceId(@newResourceId)

	=> # return value
		undo()

		if isAffected
			eventDef.removeResourceId(@newResourceId)
			eventDef.addResourceId(@oldResourceId)
