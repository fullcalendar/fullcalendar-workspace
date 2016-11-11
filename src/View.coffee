
# We need to monkey patch these methods in, because subclasses of View might have already been made

View::isResourcesBound = false
View::displayingResources = null # a promise

origSetElement = View::setElement
origRemoveElement = View::removeElement


View::setElement = (el) ->
	origSetElement.apply(this, arguments)

	processLicenseKey(
		@calendar.options.schedulerLicenseKey,
		el # container element
	)

	@displayResources()


View::triggerDateVisualsRendered = ->
	@ensureDisplayingResources().then => # wait until resources rendered
		@triggerRender()


View::removeElement = ->
	@stopDisplayingResources()
	origRemoveElement.apply(this, arguments)


View::displayEvents = ->
	Promise.all([
		@requestEvents()
		@ensureDisplayingResources()
	]).then (values) =>
		@bindEvents()
		@setEvents(values[0])


View::ensureDisplayingResources = ->
	@displayingResources or @displayResources()


View::displayResources = ->
	@displayingResources = @calendar.resourceManager.getResources().then (resources) =>
		@bindResources()
		@setResources(resources)


View::stopDisplayingResources = ->
	@displayingResources = null
	@unbindResources()
	@unsetResources()


# causes events that fire from ResourceManager to call methods of this object.
View::bindResources = ->
	if not @isResourcesBound
		@listenTo @calendar.resourceManager,
			reset: @resetResources
			add: @addResource
			remove: @removeResource
		@isResourcesBound = true # immediately lock against re-binding


# stops listening to ResourceManager events.
# triggers an 'unset' event to fire.
View::unbindResources =  ->
	if @isResourcesBound
		@stopListeningTo(@calendar.resourceManager)
		@isResourcesBound = false # finally allow re-binding


View::setResources = (resources) ->


View::unsetResources = ->


View::resetResources = (resources) ->
	@redisplayEvents()


View::addResource = ->
	@redisplayEvents()


View::removeResource = ->
	@redisplayEvents()


View::redisplayEvents = ->
	if @displayingEvents # already being displayed, or in the process?
		@displayingEvents.then => # wait for current display to finish
			@displayEvents() # redisplay
	else
		Promise.resolve() # won't try to display if not already
