
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


# TODO: more DRY
View.watch 'displayingEvents', [ 'displayingDates', 'hasEvents', 'currentResources' ], (deps) ->
	@requestRender('event', 'init', @executeEventsRender, [ @get('currentEvents') ])
, ->
	@requestRender('event', 'destroy', @executeEventsUnrender)


# Resource Data
# --------------------------------------------------------------------------------------------------


# currentEvents is optional
View::setResources = (resources, eventsPayload) ->
	if eventsPayload
		resources = @filterResourcesWithEvents(resources, eventsPayload)

	@set('currentResources', resources)
	@set('hasResources', true)
	@handleResourcesSet(resources)


View::unsetResources = ->
	@unset('currentResources')
	@unset('hasResources')
	@handleResourcesUnset()


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


# Resource Handling
# --------------------------------------------------------------------------------------------------


View::handleResourcesSet = (resources) ->


View::handleResourcesUnset = (resources) ->


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
