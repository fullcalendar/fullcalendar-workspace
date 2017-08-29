
# references to pre-monkeypatched methods
DateComponent_addChild = DateComponent::addChild
DateComponent_eventRangeToEventFootprints = DateComponent::eventRangeToEventFootprints


# configuration for subclasses
DateComponent::isResourceFootprintsEnabled = false
DateComponent::eventRenderingNeedsResourceRepo = true


# new members
DateComponent::isResourcesRendered = false


# Resource Data
# ----------------------------------------------------------------------------------------------------------------------


DateComponent.watch 'watchingResourceRepo', [ 'resourceDataSource' ], (deps) ->
	resourceDataSource = deps.resourceDataSource

	if resourceDataSource.isResolved
		@set('resourceRepo', resourceDataSource.repo)
		@set('hasResources', true)

	@listenTo resourceDataSource, 'receive', ->
		@set('resourceRepo', resourceDataSource.repo)
		@set('hasResources', true) # won't re-fire if already true
, (deps) ->
	@stopListeningTo(deps.resourceDataSource)
	@set('hasResources', false)
	@unset('resourceRepo')


# Resource Data *In Children*
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


# Resource Rendering
# ----------------------------------------------------------------------------------------------------------------------


DateComponent.watch 'displayingResources', [ 'isInDom', 'resourceDataSource' ], (deps) ->
	@startDisplayingResources(deps.resourceDataSource)
, (deps) ->
	@stopDisplayingResources(deps.resourceDataSource)


DateComponent::startDisplayingResources = (resourceDataSource) ->
	if resourceDataSource.repo.length
		@requestRenderResourceChangeset(
			new ResourceChangeset(null, resourceDataSource.repo),
			resourceDataSource.repo
		)

	@listenTo resourceDataSource, 'receive', (changeset) =>
		@requestRenderResourceChangeset(changeset, resourceDataSource.repo)


DateComponent::stopDisplayingResources = (resourceDataSource) ->
	@stopListeningTo(resourceDataSource)
	@requestRenderResourceClear()


DateComponent::requestRenderResourceChangeset = (changeset, repo) ->
	if @renderResourceAdd or @renderResourceRemove
		@requestRender =>
			@isResourcesRendered = true
			changeset.additionsRepo.iterSubtrees (resource) =>
				@renderResourceAdd(resource)
			changeset.removalsRepo.iterSubtrees (resource) =>
				@renderResourceRemove(resource)
	else if @renderResources
		@requestRender =>
			@isResourcesRendered = true
			@renderResources(repo)
		, null, 'resources', 'destroy' # to allow future destroys


DateComponent::requestRenderResourceClear = ->
	@requestRender =>
		@isResourcesRendered = false
		@renderResourceClear()
	, null, 'resources', 'destroy'


DateComponent::renderResourceAdd = null
DateComponent::renderResourceRemove = null
DateComponent::renderResources = null
DateComponent::renderResourceClear = ->
	return


# Event Rendering
# ----------------------------------------------------------------------------------------------------------------------


DateComponent::defineDisplayingEvents = ->
	depNames = [ 'displayingDates', 'eventDataSource' ]

	if @eventRenderingNeedsResourceRepo
		depNames.push('resourceRepo')

	@watch 'displayingEvents', depNames, (deps) ->
		if @eventRenderer and deps.resourceRepo
			@eventRenderer.resourceRepo = deps.resourceRepo

		@startDisplayingEvents(deps.eventDataSource)
	, (deps) ->
		@stopDisplayingEvents(deps.eventDataSource)


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
