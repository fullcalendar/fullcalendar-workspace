
EventDef_applyMiscProps = EventDef::applyMiscProps
EventDef_clone = EventDef::clone
EventDef_toLegacy = EventDef::toLegacy

EventDef.defineStandardProps({
	resourceEditable: true # automatically transfer
})

###
new class members
###
EventDef::resourceIds = null
EventDef::resourceEditable = null # `null` is unspecified state


###
NOTE: we can use defineStandardProps/applyManualStandardProps (example below)
once we do away with the deprecated eventResourceField.
###
EventDef::applyMiscProps = (rawProps) ->
	rawProps = $.extend({}, rawProps) # clone, because of delete

	@resourceIds = Resource.extractIds(rawProps, @source.calendar)

	delete rawProps.resourceId
	delete rawProps.resourceIds

	EventDef_applyMiscProps.apply(this, arguments)


###
	EventDef.defineStandardProps({
		resourceId: false # manually handle
		resourceIds: false # manually handle
	})
	EventDef::applyManualStandardProps = (rawProps) ->
		origApplyManualStandardProps.apply(this, arguments)
		@resourceIds = Resource.extractIds(rawProps, @source.calendar)
###


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
	def = EventDef_clone.apply(this, arguments)
	def.resourceIds = @getResourceIds()
	def


EventDef::toLegacy = ->
	obj = EventDef_toLegacy.apply(this, arguments)
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
