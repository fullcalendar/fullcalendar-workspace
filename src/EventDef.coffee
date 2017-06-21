
origApplyRawProps = EventDef::applyRawProps
origEventDefClone = EventDef::clone
origEventDefToLegacy = EventDef::toLegacy

# defineStandardProps won't work :(
EventDef::standardPropMap.resourceId = false # don't automatically copy
EventDef::standardPropMap.resourceIds = false # "
EventDef::standardPropMap.resourceEditable = true # automatically transfer

###
NOTE: will always be populated by applyRawProps
###
EventDef::resourceIds = null
EventDef::resourceEditable = null # `null` is unspecified state

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
	@resourceIds.push(resourceId)


EventDef::getResourceIds = ->
	@resourceIds.slice() # clone


EventDef::applyRawProps = (rawProps) ->
	isSuccess = origApplyRawProps.apply(this, arguments)
	@resourceIds = Resource.extractIds(rawProps, @source.calendar)
	isSuccess


EventDef::clone = ->
	def = origEventDefClone.apply(this, arguments)
	def.resourceIds = @getResourceIds()
	def


EventDef::toLegacy = ->
	obj = origEventDefToLegacy.apply(this, arguments)
	resourceIds = @getResourceIds()

	obj.resourceIds = resourceIds

	if @resourceEditable? # allows an unspecified state
		obj.resourceEditable = @resourceEditable

	if resourceIds.length == 1
		obj.resourceId = resourceIds[0]

	obj
