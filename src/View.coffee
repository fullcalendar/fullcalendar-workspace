
# option defaults
Calendar.defaults.refetchResourcesOnNavigate = false
Calendar.defaults.filterResourcesWithEvents = false


# references to pre-monkeypatched methods
View_setElement = View::setElement
View_removeElement = View::removeElement
View_queryScroll = View::queryScroll
View_applyScroll = View::applyScroll
View_setResources = View::setResources
View_addResource = View::addResource
View_removeResource = View::removeResource


# new members
View::resourceTextFunc = null


View::setElement = ->
	View_setElement.apply(this, arguments)

	@watchResources() # do after have the el, because might render, which assumes a render skeleton


View::removeElement = ->
	View_removeElement.apply(this, arguments)

	@unwatchResources()


# Scrolling
# ----------------------------------------------------------------------------------------------------------------------


View::queryScroll = ->
	scroll = View_queryScroll.apply(this, arguments)

	if @isResourcesRendered
		$.extend(scroll, @queryResourceScroll())

	scroll


View::applyScroll = (scroll) ->
	View_applyScroll.apply(this, arguments)

	if @isResourcesRendered
		@applyResourceScroll(scroll)


View::queryResourceScroll = ->
	{} # subclasses must implement


View::applyResourceScroll = ->
	# subclasses must implement


# Resource Binding
# ----------------------------------------------------------------------------------------------------------------------


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


# dateProfile is optional, for filtering
View::getInitialResources = (dateProfile) ->
	calendar = @calendar

	if dateProfile
		calendar.resourceManager.getResources(
			calendar.msToMoment(dateProfile.activeUnzonedRange.startMs, dateProfile.isRangeAllDay),
			calendar.msToMoment(dateProfile.activeUnzonedRange.endMs, dateProfile.isRangeAllDay)
		)
	else
		calendar.resourceManager.getResources()


# eventsPayload is optional, for filtering
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


# Resource Handling (with filtering abilities)
# ----------------------------------------------------------------------------------------------------------------------


# eventsPayload is optional, for filtering
View::setResources = (resources, eventsPayload) ->
	if eventsPayload
		resources = filterResourcesWithEvents(resources, eventsPayload)

	View_setResources.call(this, resources)


# eventsPayload is optional, for filtering
View::addResource = (resource, allResources, eventsPayload) ->
	if not eventsPayload or resourceHasEvents(resource, eventsPayload)
		View_addResource.call(this, resource, allResources)


# eventsPayload is optional, for filtering
View::removeResource = (resource, allResources, eventsPayload) ->
	if not eventsPayload or resourceHasEvents(resource, eventsPayload)
		View_removeResource.call(this, resource, allResources)


# Resource Filtering Utils
# ----------------------------------------------------------------------------------------------------------------------


resourceHasEvents = (resource, eventsPayload) ->
	Boolean(filterResourcesWithEvents([ resource ], eventsPayload).length)


filterResourcesWithEvents = (resources, eventsPayload) ->
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


# Resource Rendering Utils
# ----------------------------------------------------------------------------------------------------------------------


View::getResourceText = (resource) ->
	@getResourceTextFunc()(resource)


View::getResourceTextFunc = ->
	if @resourceTextFunc
		@resourceTextFunc
	else
		func = @opt('resourceText')
		if typeof func != 'function'
			func = (resource) ->
				resource.title or resource.id
		@resourceTextFunc = func # and return


# Triggers
# ----------------------------------------------------------------------------------------------------------------------


###
footprint is a ResourceComponentFootprint
###
View::triggerDayClick = (footprint, dayEl, ev) ->
	dateProfile = @calendar.footprintToDateProfile(footprint)

	@publiclyTrigger('dayClick', {
		context: dayEl
		args: [
			dateProfile.start
			ev
			this
			if footprint.resourceId
				@calendar.resourceManager.getResourceById(footprint.resourceId)
			else
				null
		]
	})


###
footprint is a ResourceComponentFootprint
###
View::triggerSelect = (footprint, ev) ->
	dateProfile = @calendar.footprintToDateProfile(footprint)

	@publiclyTrigger('select', {
		context: this
		args: [
			dateProfile.start
			dateProfile.end
			ev
			this
			if footprint.resourceId
				@calendar.resourceManager.getResourceById(footprint.resourceId)
			else
				null
		]
	})


# override the view's default trigger in order to provide a resourceId to the `drop` event
# TODO: make more DRY with core
View::triggerExternalDrop = (singleEventDef, isEvent, el, ev, ui) ->

	# trigger 'drop' regardless of whether element represents an event
	@publiclyTrigger('drop', {
		context: el[0]
		args: [
			singleEventDef.dateProfile.start.clone()
			ev
			ui
			singleEventDef.getResourceIds()[0]
			this
		]
	})

	if isEvent
		# signal an external event landed
		@publiclyTrigger('eventReceive', {
			context: this
			args: [
				singleEventDef.buildInstance().toLegacy()
				this
			]
		})
