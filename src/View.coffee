
# We need to monkey patch these methods in, because subclasses of View might have already been made

origSetElement = View::setElement
origRemoveElement = View::removeElement
origOnBaseRender = View::onBaseRender

Calendar.defaults.refetchResourcesOnNavigate = false


# View Rendering
# --------------------------------------------------------------------------------------------------


View::setElement = ->
	origSetElement.apply(this, arguments)
	@watchResources() # do after have the el, because might render, which assumes a render skeleton



View::removeElement = ->
	@unwatchResources()
	origRemoveElement.apply(this, arguments)


View::onBaseRender = ->
	# inject license key before 'viewRender' which is called by super's onBaseRender
	processLicenseKey(
		@calendar.options.schedulerLicenseKey
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
			@removeResource(resource, allResources)


View::unbindResourceChanges = ->
	@stopListeningTo(@calendar.resourceManager)


# Event Rendering
# --------------------------------------------------------------------------------------------------


# add the `currentResources` dependency because down the chain,
# event rendering will query for live resource data.
View.watch 'displayingEvents', [ 'displayingDates', 'currentEvents', 'currentResources' ], (deps) ->
	@requestEventsRender(deps.currentEvents)
, ->
	@requestEventsUnrender()


# Resource Data
# --------------------------------------------------------------------------------------------------


View::setResources = (resources, currentEvents) ->
	if currentEvents
		resources = @filterResourcesWithEvents(resources, currentEvents)

	@set('currentResources', resources)
	@handleResources(resources)


View::resetResources = (resources, currentEvents) ->
	if currentEvents
		resources = @filterResourcesWithEvents(resources, currentEvents)

	@set('currentResources', resources)
	@handleResourcesReset(resources)


View::unsetResources = ->
	@unset('currentResources')
	@handleResourcesUnset()


# currentEvents is optional
View::addResource = (resource, allResources, currentEvents) ->
	if currentEvents
		a = @filterResourcesWithEvents([ resource ], currentEvents)
		if not a.length
			resource = null

	if resource
		@set('currentResources', allResources)
		@handleResourceAdd(resource, allResources)
		# TODO: filter allResources against currentEvents?


View::removeResource = (resource, allResources) ->
	@set('currentResources', allResources)
	@handleResourceRemove(resource, allResources)
	# TODO: filter allResources against currentEvents?


# Resource Handling
# --------------------------------------------------------------------------------------------------


View::handleResources = (resources) ->


View::handleResourcesReset = (resources) ->


View::handleResourcesUnset = ->


View::handleResourceAdd = (resource, allResources) ->


View::handleResourceRemove = (resource, allResources) ->


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
