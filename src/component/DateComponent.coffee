
# references to pre-monkeypatched methods
DateComponent_constructed = DateComponent::constructed
DateComponent_addChild = DateComponent::addChild
DateComponent_eventRangeToEventFootprints = DateComponent::eventRangeToEventFootprints


# configuration for subclasses
DateComponent::isResourceFootprintsEnabled = false



# Resource Data In Children
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::addChild = (child) ->
	if DateComponent_addChild.call(this, child) # success?
		if @has('resourceDataSource')
			@setResourceDataSourceInChild(@get('resourceDataSource'), child)


DateComponent::setResourceDataSourceInChildren = (resourceDataSource) ->
	@iterChildren(@setResourceDataSourceInChild.bind(this, resourceDataSource))


DateComponent::setResourceDataSourceInChild = (resourceDataSource, child) ->
	child.set('resourceDataSource', resourceDataSource)


DateComponent::unsetResourceDataSourceInChildren = ->
	@iterChildren(@unsetResourceDataSourceInChild.bind(this))


DateComponent::unsetResourceDataSourceInChild = (child) ->
	child.unset('resourceDataSource')


DateComponent.watch 'resourceDataSourceInChildren', [ 'resourceDataSource' ], (deps) ->
	@setResourceDataSourceInChildren(deps.resourceDataSource)
, ->
	@unsetResourceDataSourceInChildren()


DateComponent.watch 'displayingResources', [ 'resourceDataSource' ], (deps) ->
	@startDisplayingResources(deps.resourceDataSource)
, (deps) ->
	@stopDisplayingResources(deps.resourceDataSource)


DateComponent::startDisplayingResources = (resourceDataSource) ->
	if resourceDataSource.repo.length
		@processResourceChangeset(new ResourceChangeset(null, resourceDataSource.repo))

	@listenTo resourceDataSource, 'receive', (changeset) =>
		@processResourceChangeset(changeset)


DateComponent::processResourceChangeset = (changeset) ->
	console.log('processResourceChangeset', changeset)
	# TODO: isResourcesRendered is needed for scroll


DateComponent::stopDisplayingResources = (resourceDataSource) ->
	@stopListeningTo(resourceDataSource)
	console.log('stopDisplayingResources', resourceDataSource)
	# TODO: isResourcesRendered is needed for scroll


# eventRange -> eventFootprint
# ----------------------------------------------------------------------------------------------------------------------
# eventually move this to ResourceDayTableMixin?


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


# Wire up tasks
# ----------------------------------------------------------------------------------------------------------------------


DateComponent.watch 'displayingResources', [ 'hasResources' ], ->
	@requestRender(@executeResourcesRender, [ @get('currentResources') ], 'resource', 'init')
, ->
	@requestRender(@executeResourcesUnrender, null, 'resource', 'destroy')
