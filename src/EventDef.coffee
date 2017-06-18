
origApplyRawProps = EventDef::applyRawProps
origEventDefClone = EventDef::clone
origEventDefToLegacy = EventDef::toLegacy

# defineStandardProps won't work :(
EventDef::standardPropMap.resourceId = false # don't automatically copy
EventDef::standardPropMap.resourceIds = false # "

###
NOTE: will always be populated by applyRawProps
###
EventDef::resourceIds = null

###
resourceId should already be normalized
###
EventDef::hasResourceId = (resourceId) ->
	resourceId in this.resourceIds

###
resourceId should already be normalized
###
EventDef::removeResourceId = (resourceId) ->
	removeExact(this.resourceIds, resourceId)

###
resourceId should already be normalized
###
EventDef::addResourceId = (resourceId) ->
	this.resourceIds.push(resourceId)


EventDef::getResourceIds = ->
	this.resourceIds.slice() # clone


EventDef::applyRawProps = (rawProps) ->
	isSuccess = origApplyRawProps.apply(this, arguments)
	this.resourceIds = Resource.extractIds(rawProps, @source.calendar)
	isSuccess


EventDef::clone = ->
	def = origEventDefClone.apply(this, arguments)
	def.resourceIds = this.getResourceIds()
	def


EventDef::toLegacy = ->
	obj = origEventDefToLegacy.apply(this, arguments)
	resourceIds = this.getResourceIds()

	obj.resourceIds = resourceIds

	if resourceIds.length == 1
		obj.resourceId = resourceIds[0]

	obj
