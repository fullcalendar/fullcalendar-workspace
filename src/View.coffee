
# We need to monkey patch these methods in, because subclasses of View might have already been made

View::isResourcesBound = false
View::refreshingResources = null # a promise
View::displayingResources = null # a promise


origSetDate = View::setDate
origRemoveElement = View::removeElement


View::setDate = ->
	# will cause a 'reset' if already bound.
	# otherwise, will start displayResources's fetch early.
	#@refreshingResources = @calendar.resourceManager.fetchResources()
	origSetDate.apply(this, arguments)


View::ensureDisplayBaseVisuals = ->
	Promise.resolve(@refreshingResources).then => # if not refreshing, will resolve immediately
		@ensureDisplayingResources().then => # wait until resources rendered
			processLicenseKey(
				@calendar.options.schedulerLicenseKey
				@el # container element
			)


View::removeElement = ->
	@stopDisplayingResources(true)
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


View::stopDisplayingResources = (isDestroying) ->
	@displayingResources = null
	@refreshingResources = null
	@unbindResources()
	@unsetResources(isDestroying)


# causes events that fire from ResourceManager to call methods of this object.
View::bindResources = ->
	if not @isResourcesBound
		@listenTo @calendar.resourceManager,
			set: @setResources
			unset: @unsetResources
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
	@redisplayEvents()


View::unsetResources = (isDestroying) ->
	@redisplayEvents()


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
