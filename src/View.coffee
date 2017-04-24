
# We need to monkey patch these methods in, because subclasses of View might have already been made

origSetElement = View::setElement
origRemoveElement = View::removeElement
origOnBaseRender = View::onBaseRender

Calendar.defaults.refetchResourcesOnNavigate = false


# View Rendering
# --------------------------------------------------------------------------------------------------


View::canHandleSpecificResources = false
View::isDestroying = false


View::setElement = ->
	origSetElement.apply(this, arguments)
	@watchResources() # do after have the el, because might render, which assumes a render skeleton


View::removeElement = ->
	@isDestroying = true
	@unwatchResources()
	origRemoveElement.apply(this, arguments)
	@isDestroying = false


View::onBaseRender = ->
	# inject license key before 'viewRender' which is called by super's onBaseRender
	processLicenseKey(
		@calendar.opt('schedulerLicenseKey')
		@el # container element
	)
	origOnBaseRender.apply(this, arguments)


# Resource Binding
# --------------------------------------------------------------------------------------------------


View::watchResources = ->
	initialDepNames = []
	bindingDepNames = [ 'initialResources' ]

	if @opt('refetchResourcesOnNavigate')
		initialDepNames.push('dateProfile')

	if @opt('filterResourcesWithEvents')
		bindingDepNames.push('currentEvents')

	@watch 'initialResources', initialDepNames, (deps) =>
		@fetchInitialResources(deps.dateProfile) # promise

	@watch 'bindingResources', bindingDepNames, (deps) =>
		@bindResourceChanges(deps.currentEvents)
		@setResources(deps.initialResources, deps.currentEvents)
		return # make sure no return promise
	, =>
		@unbindResourceChanges()
		@unsetResources()
		return # make sure no return promise


View::unwatchResources = ->
	@unwatch('initialResources')
	@unwatch('bindingResources')


# dateProfile is optional
View::fetchInitialResources = (dateProfile) ->
	if dateProfile
		@calendar.resourceManager.getResources(
			dateProfile.activeRange.start,
			dateProfile.activeRange.end
		)
	else
		@calendar.resourceManager.getResources()


# currentEvents is optional
View::bindResourceChanges = (currentEvents) ->
	@listenTo @calendar.resourceManager,
		set: (resources) =>
			@setResources(resources, currentEvents)
		unset: =>
			@unsetResources()
		reset: (resources) =>
			@resetResources(resources, currentEvents)
		add: (resource, allResources) =>
			@addResource(resource, allResources, currentEvents)
		remove: (resource, allResources) =>
			@removeResource(resource, allResources, currentEvents)


View::unbindResourceChanges = ->
	@stopListeningTo(@calendar.resourceManager)


# Event Rendering
# --------------------------------------------------------------------------------------------------


View.watch 'displayingEvents', [ 'displayingDates', 'hasEvents', 'currentResources' ], (deps) ->
	@requestEventsRender(@get('currentEvents'))
, ->
	@requestEventsUnrender()


# Resource Data
# --------------------------------------------------------------------------------------------------


# currentEvents is optional
View::setResources = (resources, currentEvents) ->
	if currentEvents
		resources = @filterResourcesWithEvents(resources, currentEvents)

	@set('currentResources', resources)
	@set('hasResources', true)
	@handleResourcesSet(resources)


View::unsetResources = ->
	@unset('currentResources')
	@unset('hasResources')
	@handleResourcesUnset()


# currentEvents is optional
View::resetResources = (resources, currentEvents) ->
	@startBatchRender()
	@unsetResources()
	@setResources(resources, currentEvents)
	@stopBatchRender()


# currentEvents is optional
View::addResource = (resource, allResources, currentEvents) ->

	if not @canHandleSpecificResources
		return @resetResources(allResources, currentEvents)

	if currentEvents
		a = @filterResourcesWithEvents([ resource ], currentEvents)
		if not a.length
			resource = null

	if resource
		@set('currentResources', allResources) # TODO: filter against currentEvents?
		@handleResourceAdd(resource)


View::removeResource = (resource, allResources, currentEvents) ->

	if not @canHandleSpecificResources
		return @resetResources(allResources, currentEvents)

	@set('currentResources', allResources) # TODO: filter against currentEvents?
	@handleResourceRemove(resource)


# Resource Handling
# --------------------------------------------------------------------------------------------------


View::handleResourcesSet = (resources) ->


View::handleResourcesUnset = (resources) ->


View::handleResourceAdd = (resource) ->


View::handleResourceRemove = (resource) ->


# Resource Filtering
# ------------------------------------------------------------------------------------------------------------------


View::filterResourcesWithEvents = (resources, events) ->
	resourceIdHits = {}
	for event in events
		for resourceId in @calendar.getEventResourceIds(event)
			resourceIdHits[resourceId] = true

	_filterResourcesWithEvents(resources, resourceIdHits)


# provides a new structure with masked objects
_filterResourcesWithEvents = (sourceResources, resourceIdHits) ->
	filteredResources = []
	for sourceResource in sourceResources
		if sourceResource.children.length
			filteredChildren = _filterResourcesWithEvents(sourceResource.children, resourceIdHits)
			if filteredChildren.length or resourceIdHits[sourceResource.id]
				filteredResource = createObject(sourceResource) # mask
				filteredResource.children = filteredChildren
				filteredResources.push(filteredResource)
		else # no children, so no need to mask
			if resourceIdHits[sourceResource.id]
				filteredResources.push(sourceResource)
	filteredResources
