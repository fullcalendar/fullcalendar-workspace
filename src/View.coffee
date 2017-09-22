
# option defaults
Calendar.defaults.refetchResourcesOnNavigate = false
Calendar.defaults.filterResourcesWithEvents = false

# pre-monkeypatch methods
View_setElement = View::setElement
View_removeElement = View::removeElement
View_onBaseRender = View::onBaseRender

# new properties
View::canHandleSpecificResources = false


# View Rendering
# --------------------------------------------------------------------------------------------------


View::setElement = ->
	View_setElement.apply(this, arguments)
	@watchResources() # do after have the el, because might render, which assumes a render skeleton


View::removeElement = ->
	@unwatchResources()
	View_removeElement.apply(this, arguments)


# Show the warning even for non-resource views
View::onBaseRender = ->
	View_onBaseRender.apply(this, arguments)

	# inject license key before 'viewRender' which is called by super's onBaseRender
	processLicenseKey(
		@opt('schedulerLicenseKey')
		@el # container element
	)


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
		@getInitialResources(deps.dateProfile) # promise

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
View::getInitialResources = (dateProfile) ->
	calendar = @calendar

	if dateProfile
		calendar.resourceManager.getResources(
			calendar.msToMoment(dateProfile.activeUnzonedRange.startMs, dateProfile.isRangeAllDay),
			calendar.msToMoment(dateProfile.activeUnzonedRange.endMs, dateProfile.isRangeAllDay)
		)
	else
		calendar.resourceManager.getResources()


# eventsPayload is optional
View::bindResourceChanges = (eventsPayload) ->
	@listenTo @calendar.resourceManager,
		set: (resources) =>
			@setResources(resources, eventsPayload)
		unset: =>
			@unsetResources()
		reset: (resources) =>
			@resetResources(resources, eventsPayload)
		add: (resource, allResources) =>
			@addResource(resource, allResources, eventsPayload)
		remove: (resource, allResources) =>
			@removeResource(resource, allResources, eventsPayload)


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
View::setResources = (resources, eventsPayload) ->
	if eventsPayload
		resources = @filterResourcesWithEvents(resources, eventsPayload)

	@set('currentResources', resources)
	@set('hasResources', true)


View::unsetResources = ->
	@unset('currentResources')
	@unset('hasResources')


# eventsPayload is optional
View::resetResources = (resources, eventsPayload) ->
	@startBatchRender()
	@unsetResources()
	@setResources(resources, eventsPayload)
	@stopBatchRender()


# eventsPayload is optional
View::addResource = (resource, allResources, eventsPayload) ->

	if not @canHandleSpecificResources
		return @resetResources(allResources, eventsPayload)

	if eventsPayload
		a = @filterResourcesWithEvents([ resource ], eventsPayload)
		if not a.length
			resource = null

	if resource
		@set('currentResources', allResources) # TODO: filter against eventsPayload?
		@handleResourceAdd(resource)


View::removeResource = (resource, allResources, eventsPayload) ->

	if not @canHandleSpecificResources
		return @resetResources(allResources, eventsPayload)

	@set('currentResources', allResources) # TODO: filter against eventsPayload?
	@handleResourceRemove(resource)


# Resource Change Handling
# --------------------------------------------------------------------------------------------------


View::handleResourceAdd = (resource) ->


View::handleResourceRemove = (resource) ->


# Resource Filtering
# ------------------------------------------------------------------------------------------------------------------


View::filterResourcesWithEvents = (resources, eventsPayload) ->
	resourceIdHits = {}

	for id of eventsPayload
		eventInstanceGroup = eventsPayload[id]

		# TODO: not efficient looping over repeat instances
		for eventInstance in eventInstanceGroup.eventInstances
			for resourceId in eventInstance.def.getResourceIds()
				resourceIdHits[resourceId] = true

	_filterResourcesWithEvents(resources, resourceIdHits)


# provides a new structure with masked objects
_filterResourcesWithEvents = (sourceResources, resourceIdHits) ->
	filteredResources = []
	for sourceResource in sourceResources
		if sourceResource.children.length
			filteredChildren = _filterResourcesWithEvents(sourceResource.children, resourceIdHits)
			if filteredChildren.length or resourceIdHits[sourceResource.id]
				filteredResource = Object.create(sourceResource) # mask
				filteredResource.children = filteredChildren
				filteredResources.push(filteredResource)
		else # no children, so no need to mask
			if resourceIdHits[sourceResource.id]
				filteredResources.push(sourceResource)
	filteredResources
