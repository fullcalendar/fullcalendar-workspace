
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
	@bindResources() # wait until after skeleton
	promise


View::removeElement = ->
	@unbindResources({ skipRerender: true }) # don't bother to make display pretty for after
	origRemoveElement.apply(this, arguments)


# Date Setting / Rendering
# --------------------------------------------------------------------------------------------------


View::handleDate = (date, isReset) ->
	if isReset and @opt('refetchResourcesOnNavigate')
		@unsetResources({ skipUnrender: true }) # keep same resources showing
		@fetchResources()

	origHandleDate.apply(this, arguments)


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


View::bindResources = ->
	if not @isResourcesBound
		@isResourcesBound = true
		@trigger('resourcesBind')

		promise = # first-time get/fetch
			if @opt('refetchResourcesOnNavigate')
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
		@handleUnsetResources(teardownOptions)
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
		@handleAddResource(resource)
		@trigger('resourceAdd', resource)


View::removeResource = (resource) ->
	if @isResourcesSet
		@handleRemoveResource(resource)
		@trigger('resourceRemove', resource)


# Resource Handling
# --------------------------------------------------------------------------------------------------


View::handleResources = (resources) ->
	if @isEventsRendered
		@requestCurrentEventsRender() # event coloring might have changed
	# else (not already renderd)
	#	executeEventsRender waits for resources and renders events


View::handleUnsetResources = (teardownOptions={}) ->
	# event rendering is dependent on resource data
	@requestEventsUnrender()


View::handleAddResource = (resource) ->
	if @isEventsRendered
		@requestCurrentEventsRender() # event coloring might have changed


View::handleRemoveResource = (resource) ->
	if @isEventsRendered
		@requestCurrentEventsRender() # event coloring might have changed


# Resource Data Access
# --------------------------------------------------------------------------------------------------


View::requestResources = ->
	@calendar.resourceManager.getResources()


View::fetchResources = ->
	@calendar.resourceManager.fetchResources()


# returns *unfiltered* current resources.
# assumes isResourcesSet.
View::getCurrentResources = ->
	@calendar.resourceManager.topLevelResources
