
origEventDefClone = EventDef::clone
origEventDefToLegacy = EventDef::toLegacy
origApplyManualStandardProps = EventDef::applyManualStandardProps
origApplyMiscProps = EventDef::applyMiscProps

# defineStandardProps won't work :( ... why? i forget
EventDef::standardPropMap.resourceId = false # manually handle
EventDef::standardPropMap.resourceIds = false # manually handle
EventDef::standardPropMap.resourceEditable = true # automatically transfer

###
NOTE: will always be populated by applyMiscProps
###
EventDef::resourceIds = null
EventDef::resourceEditable = null # `null` is unspecified state


EventDef::applyManualStandardProps = (rawProps) ->
	origApplyManualStandardProps.apply(this, arguments)

	@resourceIds = Resource.extractIds(rawProps, @source.calendar)


###
resourceId should already be normalized
###
EventDef::hasResourceId = (resourceId) ->
	resourceId in @resourceIds

###
resourceId should already be normalized
###
EventDef::removeResourceId = (resourceId) ->
	removeExact(@resourceIds, resourceId)

###
resourceId should already be normalized
###
EventDef::addResourceId = (resourceId) ->
	if not @hasResourceId(resourceId)
		@resourceIds.push(resourceId)


EventDef::getResourceIds = ->
	if @resourceIds
		@resourceIds.slice() # clone
	else
		[]


EventDef::clone = ->
	def = origEventDefClone.apply(this, arguments)
	def.resourceIds = @getResourceIds()
	def


EventDef::toLegacy = ->
	obj = origEventDefToLegacy.apply(this, arguments)
	resourceIds = @getResourceIds()

	obj.resourceId =
		if resourceIds.length == 1
			resourceIds[0]
		else
			null

	obj.resourceIds =
		if resourceIds.length > 1
			resourceIds
		else
			null

	if @resourceEditable? # allows an unspecified state
		obj.resourceEditable = @resourceEditable

	obj
