
# option defaults
Calendar.defaults.refetchResourcesOnNavigate = false
Calendar.defaults.filterResourcesWithEvents = false


# references to pre-monkeypatched methods
View_setElement = View::setElement
View_removeElement = View::removeElement
View_queryScroll = View::queryScroll
View_applyScroll = View::applyScroll


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
		@watchCurrentEvents()
		bindingDepNames.push('currentEventRanges')

	@watch 'initialResources', initialDepNames, (deps) =>
		@getInitialResources(deps.dateProfile) # promise

	@watch 'bindingResources', bindingDepNames, (deps) =>
		@bindResourceChanges(deps.currentEventRanges)
		@setUnfilteredResources(deps.initialResources, deps.currentEventRanges)
		return # make sure no return promise
	, =>
		@unbindResourceChanges()
		@unsetUnfilteredResources()
		return # make sure no return promise

###
HACK, until resources becomes a proper data source,
in which case we can make a masking data source that uses the events data source.
###
View::watchCurrentEvents = ->
	@watch 'watchingCurrentEvents', [ 'eventDataSource', 'dateProfile' ], (deps) ->
		eventDataSource = deps.eventDataSource

		registerHash = (byDefId) =>
			unzonedRange = deps.dateProfile.activeUnzonedRange
			eventRanges = []

			for id, eventInstances of byDefId
				eventInstanceGroup = new EventInstanceGroup(eventInstances)
				eventRanges.push.apply( # append
					eventRanges,
					eventInstanceGroup.getAllEventRanges(unzonedRange)
				)

			@set('currentEventRanges', eventRanges)

		if eventDataSource.isPopulated
			registerHash(eventDataSource.instanceRepo.byDefId)

		@listenTo eventDataSource, 'receive', =>
			registerHash(eventDataSource.instanceRepo.byDefId)

	, (deps) ->
		@stopListeningTo(deps.eventDataSource)
		@unset('currentEventRanges')


View::unwatchResources = ->
	@unwatch('watchingCurrentEvents')
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


# currentEventRanges is optional, for filtering
View::bindResourceChanges = (currentEventRanges) ->
	@listenTo @calendar.resourceManager,
		set: (resources) =>
			@setUnfilteredResources(resources, currentEventRanges)
		unset: =>
			@unsetUnfilteredResources()
		reset: (resources) =>
			@resetUnfilteredResources(resources, currentEventRanges)
		add: (resource, allResources) =>
			@addUnfilteredResource(resource, allResources, currentEventRanges)
		remove: (resource, allResources) =>
			@removeUnfilteredResource(resource, allResources, currentEventRanges)


View::unbindResourceChanges = ->
	@stopListeningTo(@calendar.resourceManager)


View::setUnfilteredResources = (resources, currentEventRanges) ->
	if currentEventRanges
		resources = filterResourcesWithEvents(resources, currentEventRanges)
	@setResources(resources)


View::unsetUnfilteredResources = ->
	@unsetResources()


View::resetUnfilteredResources = (resources, currentEventRanges) ->
	if currentEventRanges
		resources = filterResourcesWithEvents(resources, currentEventRanges)
	@resetResources(resources)


View::addUnfilteredResource = (resource, allResources, currentEventRanges) ->
	if not currentEventRanges or resourceHasEvents(resource, currentEventRanges)
		@addResource(resource, allResources)


View::removeUnfilteredResource = (resource, allResources, currentEventRanges) ->
	if not currentEventRanges or resourceHasEvents(resource, currentEventRanges)
		@removeResource(resource, allResources)


# Resource Filtering Utils
# ----------------------------------------------------------------------------------------------------------------------


resourceHasEvents = (resource, currentEventRanges) ->
	Boolean(filterResourcesWithEvents([ resource ], currentEventRanges).length)


filterResourcesWithEvents = (resources, currentEventRanges) ->
	resourceIdHits = {}

	for eventRange in currentEventRanges
		for resourceId in eventRange.eventDef.getResourceIds()
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


View::processLicenseKey = ->
	# inject license key before 'viewRender' which is called by super's onBaseRender
	processLicenseKey(
		@opt('schedulerLicenseKey')
		@el # container element
	)


# Modify "base" tasks
# ----------------------------------------------------------------------------------------------------------------------

# fire viewRender/viewDestroy any time there is a resource change
View.watch 'displayingBase', [ 'dateProfile', 'currentResources' ], (deps) ->
	@requestRender(@processLicenseKey)
	@whenSizeUpdated(@triggerBaseRendered)
, ->
	@triggerBaseUnrendered()
