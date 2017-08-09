
# references to pre-monkeypatched methods
DateComponent_setElement = DateComponent::setElement
DateComponent_addChild = DateComponent::addChild
DateComponent_eventRangeToEventFootprints = DateComponent::eventRangeToEventFootprints


# configuration for subclasses
DateComponent::isResourceRenderingEnabled = false


# new members
DateComponent::isResourcesRendered = false
DateComponent::resourceMessageAggregator = null


DateComponent::setElement = (el) ->
	DateComponent_setElement.apply(this, arguments)

	@ensureResourceMessageAggregator()
	@watchDisplayingResources()
	@watchDisplayingEvents()


# Message Aggregation
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::addChild = (child) ->
	DateComponent_addChild.apply(this, arguments)

	if child.isResourceRenderingEnabled
		@ensureResourceMessageAggregator().addChild(child)


# lazily create, to allow instantiation early in the process, for addChild
DateComponent::ensureResourceMessageAggregator = ->
	@resourceMessageAggregator or= buildMessageAggregator(this, 'resourcesRender', 'resourcesUnrender')


# Dependencies for Event / Resource Rendering
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::watchDisplayingResources = ->
	if @isResourceRenderingEnabled
		@watch 'displayingResources', [ 'hasResources' ], =>
			@requestRender('resource', 'init', @executeResourcesRender, [ @get('currentResources') ])
		, =>
			@requestRender('resource', 'destroy', @executeResourcesUnrender)


DateComponent::watchDisplayingEvents = ->
	@watch 'displayingEvents', [ # overrides previous 'displayingEvents' definition
		'displayingDates'
		'hasEvents'
		if @isResourceRenderingEnabled
			'displayingResources'
		else
			'hasResources' # still needs resource data for event coloring
	], =>
		@requestRender('event', 'init', @executeEventsRender, [ @get('currentEvents') ])
	, =>
		@requestRender('event', 'destroy', @executeEventsUnrender)


# Resource Data Handling
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::handleResourcesSet = (resources) ->
	@set('currentResources', resources)
	@set('hasResources', true)
	@callChildren('handleResourcesSet', arguments)


DateComponent::handleResourcesUnset = ->
	@unset('hasResources')
	@unset('currentResources')
	@callChildren('handleResourcesUnset', arguments)


DateComponent::handleResourcesReset = (resources) ->
	@startBatchRender()
	@handleResourcesUnset()
	@handleResourcesSet(resources)
	@stopBatchRender()


DateComponent::handleResourceAdd = (resource, allResources) ->
	@set('currentResources', allResources)
	@callChildren('handleResourceAdd', arguments)

	if @has('displayingResources')
		@requestRender('resource', 'add', @renderResourceAdd, [ resource ])


DateComponent::handleResourceRemove = (resource, allResources) ->
	@set('currentResources', allResources)
	@callChildren('handleResourceRemove', arguments)

	if @has('displayingResources')
		@requestRender('resource', 'remove', @renderResourceRemove, [ resource ])


# Resource High-level Rendering
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::executeResourcesRender = (resources) ->
	@renderResources(resources)
	@trigger('resourcesRender')
	@isResourcesRendered = true


DateComponent::executeResourcesUnrender = ->
	@trigger('before:resourceUnrender')
	@unrenderResources()
	@isResourcesRendered = true


# Resource Rendering Implementation
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::renderResources = (resources) ->
	# subclasses can implement


DateComponent::unrenderResources = ->
	# subclasses can implement


DateComponent::renderResourceAdd = ->
	# rerenders all by default
	@unrenderResources()
	@renderResources(@get('currentResources'))


DateComponent::renderResourceRemove = ->
	# rerenders all by default
	@unrenderResources()
	@renderResources(@get('currentResources'))


# eventRange -> eventFootprint
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::eventRangeToEventFootprints = (eventRange) ->
	if not @isResourceRenderingEnabled
		DateComponent_eventRangeToEventFootprints.apply(this, arguments)
	else
		eventDef = eventRange.eventDef
		resourceIds = eventDef.getResourceIds()

		if resourceIds.length
			for resourceId in resourceIds # returns the accumulation
				new EventFootprint(
					new ResourceComponentFootprint(
						eventRange.unzonedRange
						eventDef.isAllDay()
						resourceId
					)
					eventDef
					eventRange.eventInstance # might not exist
				)
		else if eventDef.hasBgRendering() # TODO: it's strange to be relying on this
			DateComponent_eventRangeToEventFootprints.apply(this, arguments)
		else
			[]
