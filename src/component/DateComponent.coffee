
# references to pre-monkeypatched methods
DateComponent_constructed = DateComponent::constructed
DateComponent_addChild = DateComponent::addChild
DateComponent_removeChild = DateComponent::removeChild
DateComponent_eventRangeToEventFootprints = DateComponent::eventRangeToEventFootprints


# configuration for subclasses
DateComponent::isResourceFootprintsEnabled = false


# new members
DateComponent::isResourcesRendered = false
DateComponent::resourceMessageAggregator = null


DateComponent::constructed = ->
	DateComponent_constructed.apply(this, arguments)

	@resourceMessageAggregator = buildMessageAggregator(this, 'resourcesRender', 'resourcesUnrender')
	@watchDisplayingResources()
	@watchDisplayingEvents()


# Message Aggregation
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::addChild = (child) ->
	DateComponent_addChild.apply(this, arguments)

	@resourceMessageAggregator.addChild(child)


DateComponent::removeChild = (child) ->
	DateComponent_removeChild.apply(this, arguments)

	@resourceMessageAggregator.removeChild(child)


# Dependencies for Event / Resource Rendering
# ----------------------------------------------------------------------------------------------------------------------


# all components will go through resource rendering flow
# it is up to them if they want to render anything
DateComponent::watchDisplayingResources = ->
	@watch 'displayingResources', [ 'hasResources' ], =>
		@requestRender(@executeResourcesRender, [ @get('currentResources') ], 'resource', 'init')
	, =>
		@requestRender(@executeResourcesUnrender, null, 'resource', 'destroy')


DateComponent::watchDisplayingEvents = ->
	@watch 'displayingEvents', [ # overrides previous 'displayingEvents' definition
		'displayingDates'
		'hasEvents'
		if @isResourceFootprintsEnabled
			'displayingResources'
		else
			'currentResources' # needed for event coloring
	], =>
		@requestRender(@executeEventsRender, [ @get('currentEvents') ], 'event', 'init')
	, =>
		@requestRender(@executeEventsUnrender, null, 'event', 'destroy')


# Resource Data Handling
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::setResources = (resources) ->
	@set('currentResources', resources)
	@set('hasResources', true)
	@setResourcesInChildren(resources)


DateComponent::setResourcesInChildren = (resources) ->
	@callChildren('setResources', arguments)


DateComponent::unsetResources = ->
	@unset('hasResources')
	@unset('currentResources')
	@unsetResourcesInChildren()


DateComponent::unsetResourcesInChildren = ->
	@callChildren('unsetResources', arguments)


DateComponent::resetResources = (resources) ->
	@startBatchRender()
	@unsetResources()
	@setResources(resources)
	@stopBatchRender()


DateComponent::addResource = (resource, allResources) ->
	@set('currentResources', allResources)
	@callChildren('addResource', arguments)

	if @has('displayingResources')
		@requestRender(@renderResourceAdd, [ resource ], 'resource', 'add')


DateComponent::handleResourceRemove = (resource, allResources) ->
	@set('currentResources', allResources)
	@callChildren('handleResourceRemove', arguments)

	if @has('displayingResources')
		@requestRender(@renderResourceRemove, [ resource ], 'resource', 'remove')


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
	if not @isResourceFootprintsEnabled
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
