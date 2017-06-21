
origEventDefClone = EventDef::clone
origEventDefToLegacy = EventDef::toLegacy
origApplyOtherRawProps = EventDef::applyOtherRawProps

# allowRawProps won't work :(
EventDef::standardPropMap.resourceEditable = true # automatically transfer

###
NOTE: will always be populated by applyOtherRawProps
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


EventDef::applyOtherRawProps = (rawProps) ->
	rawProps = $.extend({}, rawProps) # clone, because of delete

	@resourceIds = Resource.extractIds(rawProps, @source.calendar)

	delete rawProps.resourceId
	delete rawProps.resourceIds

	origApplyOtherRawProps.apply(this, arguments)
