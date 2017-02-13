
# We need to monkey patch these methods in, because subclasses of View might have already been made

origSetElement = View::setElement
origRemoveElement = View::removeElement
origHandleDate = View::handleDate
origOnDateRender = View::onDateRender
origExecuteEventsRender = View::executeEventsRender

View::isResourcesBound = false
View::isResourcesSet = false

Calendar.defaults.refetchResourcesOnNavigate = false


# View Rendering
# --------------------------------------------------------------------------------------------------


View::setElement = ->
	promise = origSetElement.apply(this, arguments)

	if not @opt('refetchResourcesOnNavigate') # otherwise, handleDate will do it
		@bindResources() # wait until after skeleton

	promise


View::removeElement = ->
	@unbindResources({ skipRerender: true }) # don't bother to make display pretty for after
	origRemoveElement.apply(this, arguments)


# Date Setting / Rendering
# --------------------------------------------------------------------------------------------------


###
Replace the supermethod's logic. Important to unbind/bind *events* (TODO: make more DRY)
###
View::handleDate = (date, isReset) ->
	resourcesNeedDate = @opt('refetchResourcesOnNavigate')

	@unbindEvents()
	if resourcesNeedDate
		@unbindResources({ skipUnrender: true }) # keep same resources showing

	@requestDateRender(date).then =>
		@bindEvents()
		if resourcesNeedDate
			@bindResources(true) # forceInitialFetch=true


View::onDateRender = ->
	processLicenseKey(
		@calendar.options.schedulerLicenseKey
		@el # container element
	)
	origOnDateRender.apply(this, arguments) # fire public handlers


# Event Rendering
# --------------------------------------------------------------------------------------------------


View::executeEventsRender = (events) ->
	@whenResourcesSet().then => # wait for resource data, for coloring
		origExecuteEventsRender.call(this, events)


# Resource Binding
# --------------------------------------------------------------------------------------------------


View::bindResources = (forceInitialFetch) ->
	if not @isResourcesBound
		@isResourcesBound = true
		@trigger('resourcesBind')

		promise = # first-time get/fetch
			if forceInitialFetch
				@fetchResources()
			else
				@requestResources()

		@rejectOn('resourcesUnbind', promise).then (resources) =>
			@listenTo @calendar.resourceManager,
				set: @setResources
				reset: @setResources
				unset: @unsetResources
				add: @addResource
				remove: @removeResource
			@setResources(resources)


View::unbindResources = (teardownOptions) ->
	if @isResourcesBound
		@isResourcesBound = false
		@stopListeningTo(@calendar.resourceManager)
		@unsetResources(teardownOptions)
		@trigger('resourcesUnbind')


# Resource Setting/Unsetting
# --------------------------------------------------------------------------------------------------


View::setResources = (resources) ->
	isReset = @isResourcesSet
	@isResourcesSet = true
	@handleResources(resources, isReset)
	@trigger(
		if isReset then 'resourcesReset' else 'resourcesSet'
		resources
	)


View::unsetResources = (teardownOptions) ->
	if @isResourcesSet
		@isResourcesSet = false
		@handleResourcesUnset(teardownOptions)
		@trigger('resourcesUnset')


View::whenResourcesSet = ->
	if @isResourcesSet
		Promise.resolve()
	else
		new Promise (resolve) =>
			@one('resourcesSet', resolve)


# Resource Adding/Removing
# --------------------------------------------------------------------------------------------------


View::addResource = (resource) ->
	if @isResourcesSet
		@handleResourceAdd(resource)
		@trigger('resourceAdd', resource)


View::removeResource = (resource) ->
	if @isResourcesSet
		@handleResourceRemove(resource)
		@trigger('resourceRemove', resource)


# Resource Handling
# --------------------------------------------------------------------------------------------------


View::handleResources = (resources) ->
	if @isEventsRendered
		@requestCurrentEventsRender() # event coloring might have changed
	# else (not already renderd)
	#	executeEventsRender waits for resources and renders events


View::handleResourcesUnset = (teardownOptions={}) ->
	# event rendering is dependent on resource data
	@requestEventsUnrender()


View::handleResourceAdd = (resource) ->
	if @isEventsRendered
		@requestCurrentEventsRender() # event coloring might have changed


View::handleResourceRemove = (resource) ->
	if @isEventsRendered
		@requestCurrentEventsRender() # event coloring might have changed


# Resource Data Access
# --------------------------------------------------------------------------------------------------


###
Like fetchResources, but won't refetch if already fetched (regardless of start/end).
If refetchResourcesOnNavigate is enabled,
this function expects the view's start/end to be already populated.
###
View::requestResources = ->
	if @opt('refetchResourcesOnNavigate')
		@calendar.resourceManager.getResources(@start, @end)
	else
		@calendar.resourceManager.getResources()


###
If refetchResourcesOnNavigate is enabled,
this function expects the view's start/end to be already populated.
###
View::fetchResources = ->
	if @opt('refetchResourcesOnNavigate')
		@calendar.resourceManager.fetchResources(@start, @end)
	else
		@calendar.resourceManager.fetchResources()


# returns *unfiltered* current resources.
# assumes isResourcesSet.
View::getCurrentResources = ->
	@calendar.resourceManager.topLevelResources
