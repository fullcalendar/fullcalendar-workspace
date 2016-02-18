
# We need to monkey patch these methods in, because subclasses of View might have already been made

origDisplayView = View::displayView
origRenderSkeleton = View::renderSkeleton
origUnrenderSkeleton = View::unrenderSkeleton
origDisplayEvents = View::displayEvents

View::isResourcesBound = false
View::settingResources = null # a promise


View::displayView = ->
	origDisplayView.apply(this, arguments)

	# TODO: get this into renderSkeleton somehow
	# won't rerender if a warning message already exists
	processLicenseKey(
		@calendar.options.schedulerLicenseKey,
		@el # container element
	)

	@bindResources()
	@whenResources() # 'render' trigger and sizing waits for this


View::unrenderSkeleton = ->
	origUnrenderSkeleton.apply(this, arguments)
	@unbindResources()


View::displayEvents = (events) ->
	# make sure resource data is received first (for event coloring at the simplest).
	@whenResources =>
		origDisplayEvents.call(this, events)


# causes events that fire from ResourceManager to call methods of this object.
# an initial 'set' event is guaranteed to fire.
View::bindResources = ->
	if not @isResourcesBound
		@isResourcesBound = true # immediately lock against re-binding

		# an intercept that resolves the promise
		@settingResources = $.Deferred()
		setResources = (resources) =>
			@setResources(resources)
			@settingResources.resolve()

		@calendar.resourceManager
			.on 'set', @_setResources = setResources
			.on 'unset', @_unsetResources = proxy(this, 'unsetResources')
			.on 'reset', @_resetResources = proxy(this, 'resetResources')
			.on 'add', @_addResource = proxy(this, 'addResource')
			.on 'remove', @_removeResource = proxy(this, 'removeResource')

		if @calendar.resourceManager.hasFetched()
			# already has results. simulate a 'set'
			setResources(@calendar.resourceManager.topLevelResources)
		else
			# start a fetch if hasn't already happened. will eventually trigger 'set'
			@calendar.resourceManager.getResources()


# stops listening to ResourceManager events.
# triggers an 'unset' event to fire.
View::unbindResources = ->
	if @isResourcesBound

		@calendar.resourceManager
			.off 'set', @_setResources
			.off 'unset', @_unsetResources
			.off 'reset', @_resetResources
			.off 'add', @_addResource
			.off 'remove', @_removeResource

		if @settingResources.state() == 'resolved'
			@unsetResources()
		@settingResources = null

		@isResourcesBound = false # finally allow re-binding


# HACK instead of accessing @settingResources directly.
# if already resolved, sometimes .promise() or .then() would not execute synchronously,
# which might cause event/resource rendering to happen asynchronously,
# which might suprise some people.
# TODO: research why jQuery promises might do this.
#
# `thenFunc` is optional.
# returns a promose.
View::whenResources = (thenFunc) ->
	if @settingResources.state() == 'resolved'
		$.when(if thenFunc then thenFunc())
	else if thenFunc
		@settingResources.then(thenFunc)
	else
		@settingResources.promise()


# Methods for handling resource data
# ------------------------------------------------------------------------------------------


View::setResources = (resources) ->
	# subclasses should implement


View::unsetResources = ->
	# subclasses should implement


View::resetResources = (resources) ->
	@calendar.rerenderEvents() # useful for views that don't formally support resources


View::addResource = (resource) ->
	# for implementations don't want to optimize for a single add, just do a reset
	@resetResources(@calendar.resourceManager.topLevelResources)


View::removeResource = (resource) ->
	# for implementations don't want to optimize for a single remove, just do a reset
	@resetResources(@calendar.resourceManager.topLevelResources)
