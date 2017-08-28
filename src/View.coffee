
# option defaults
Calendar.defaults.refetchResourcesOnNavigate = false
Calendar.defaults.filterResourcesWithEvents = false


# references to pre-monkeypatched methods
View_queryScroll = View::queryScroll
View_applyScroll = View::applyScroll


# new members
View::resourceTextFunc = null


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


View.watch 'watchingResourceDataSource', [], ->
	depNames = []

	if @opt('refetchResourcesOnNavigate')
		depNames.push('dateProfile')

	if @opt('filterResourcesWithEvents')
		depNames.push('eventDataSource')

	@watch 'resourceDataSource', depNames, (deps) ->
		@requestResources(deps.dateProfile, deps.eventDataSource)


View::requestResources = (dateProfile, eventDataSource) ->
	calendar = @calendar
	resourceManager = calendar.resourceManager

	if dateProfile
		forceAllDay = dateProfile.isRangeAllDay && !@usesMinMaxTime
		resourceManager.request(
			calendar.msToMoment(dateProfile.startMs, forceAllDay)
			calendar.msToMoment(dateProfile.endMs, forceAllDay)
		)
	else
		resourceManager.request()

	resourceManager


# Resource Filtering Utils
# ----------------------------------------------------------------------------------------------------------------------
# TODO: these are now dead code! utilize eventDataSource!


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
				@calendar.resourceManager.repo.getById(footprint.resourceId)
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
				@calendar.resourceManager.repo.getById(footprint.resourceId)
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
