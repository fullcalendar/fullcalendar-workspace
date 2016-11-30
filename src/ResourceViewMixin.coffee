
###
A view that structurally distinguishes events by resource
###
ResourceViewMixin = # expects a View

	isResourcesRendered: false
	resourceRenderQueue: null
	resourceTextFunc: null


	setElement: ->
		# put this first, because setElement might need it.
		# don't clear this out in removeElement. headless rendering might continue.
		@resourceRenderQueue = new RunQueue()

		View::setElement.apply(this, arguments)


	# Date Rendering
	# ------------------------------------------------------------------------------------------------------------------


	triggerDateRender: ->
		@rejectOn('dateUnrender', @whenResourcesRendered()).then =>
			View::triggerDateRender.call(this)


	# Event Rendering
	# ------------------------------------------------------------------------------------------------------------------


	# adds some dependencies to the event rendering process.
	# don't need to reject-on-events-unrender because an events unrender request
	# will always be queued up after this finishes, it won't interrupt.
	forceEventsRender: (events) ->
		@whenResourcesSet().then => # needs the resource data
			@whenResourcesRendered().then => # AND needs to have rendered that resource data (esp important for skipUnrender)
				View::forceEventsRender.call(this, events)


	# Resource Data
	# ------------------------------------------------------------------------------------------------------------------


	setResources: (resources) ->
		isReset = @isResourcesSet
		@isResourcesSet = true

		@requestResourcesRender(resources)

		if not isReset
			@triggerWith('resourcesSet', this, []) # TODO: .trigger()


	unsetResources: (teardownOptions={}) ->
		if @isResourcesSet
			@isResourcesSet = false

			if not teardownOptions.skipUnrender
				@requestResourcesUnrender(teardownOptions)

			@triggerWith('resourcesUnset', this, []) # TODO: .trigger()


	addResource: (resource) ->
		@requestResourcesRerender() # rerender all by default. subclasses can opt to use requestResourceRender


	removeResource: (resource) ->
		@requestResourcesRerender() # rerender all by default. subclasses can opt to use requestResourceUnrender


	# Resource Rendering Queue
	# ------------------------------------------------------------------------------------------------------------------


	requestResourcesRender: (resources) ->
		@resourceRenderQueue.add =>
			@forceResourcesRender(resources)


	forceResourcesRender: (resources) ->
		@captureScroll()
		@freezeHeight()
		@forceResourcesUnrender().then =>
			@renderResources(resources)
			@thawHeight()
			@releaseScroll()
			@afterResourcesRender()


	afterResourcesRender: ->
		@isResourcesRendered = true
		@triggerWith('resourcesRender', this, [])

		# the 'resourcesRender' trigger might have rendered pending events,
		# but if not, make sure events are rendered
		if @isEventsSet and not @isEventsRendered
			@requestEventsRerender()
		return # don't return promise result


	whenResourcesRendered: -> # TODO: whenResourcesRender
		if @isResourcesRendered
			Promise.resolve()
		else
			new Promise (resolve) =>
				@one('resourcesRender', resolve)


	requestResourcesUnrender: (teardownOptions) ->
		if @isResourcesRendered
			@resourceRenderQueue.add =>
				@forceResourcesUnrender(teardownOptions)
		else
			Promise.resolve()


	forceResourcesUnrender: (teardownOptions) ->
		if @isResourcesRendered
			@requestEventsUnrender().then =>
				@captureScroll()
				@freezeHeight()
				@unrenderResources(teardownOptions)
				@thawHeight()
				@releaseScroll()
				@afterResourcesUnrender()
		else
			Promise.resolve()


	afterResourcesUnrender: ->
		@isResourcesRendered = false


	requestResourceRender: (resource) -> # not called by default
		@resourceRenderQueue.add =>
			@renderResource(resource)


	requestResourceUnrender: (resource) -> # not called by default
		@resourceRenderQueue.add =>
			@unrenderResource(resource)


	requestResourcesRerender: ->
		if @isResourcesSet
			@requestResourcesRender(@calendar.resourceManager.topLevelResources)
		else
			Promise.reject()


	# Actual Resource Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderResources: (resources) ->
		# abstract


	unrenderResources: (teardownOptions) ->
		# abstract


	renderResource: (resource) ->
		# abstract, for requestResourceRender


	unrenderResource: (resource) ->
		# abstract, for requestResourceUnrender


	# Event Dragging
	# ------------------------------------------------------------------------------------------------------------------


	# if an event's dates are not draggable, but it's resource IS, still allow dragging
	isEventDraggable: (event) ->
		@isEventResourceEditable(event) or View::isEventDraggable.call(this, event)


	isEventResourceEditable: (event) ->
		event.resourceEditable ?
			(event.source || {}).resourceEditable ?
			@opt('eventResourceEditable') ?
			@isEventGenerallyEditable(event)


	# Resource Rendering Utils
	# ------------------------------------------------------------------------------------------------------------------


	getResourceText: (resource) ->
		@getResourceTextFunc()(resource)


	getResourceTextFunc: ->
		if @resourceTextFunc
			@resourceTextFunc
		else
			func = @opt('resourceText')
			if typeof func != 'function'
				func = (resource) ->
					resource.title or resource.id
			@resourceTextFunc = func # and return


	# Triggers
	# ------------------------------------------------------------------------------------------------------------------


	triggerDayClick: (span, dayEl, ev) ->
		resourceManager = @calendar.resourceManager

		@trigger(
			'dayClick'
			dayEl # this
			@calendar.applyTimezone(span.start)
			ev
			this # maintain order. this will also be automatically inserted last. oh well
			resourceManager.getResourceById(span.resourceId)
		)


	triggerSelect: (span, ev) ->
		resourceManager = @calendar.resourceManager

		@trigger(
			'select'
			null
			@calendar.applyTimezone(span.start)
			@calendar.applyTimezone(span.end)
			ev
			this # maintain order. this will also be automatically inserted last. oh well
			resourceManager.getResourceById(span.resourceId)
		)


	# override the view's default trigger in order to provide a resourceId to the `drop` event
	# TODO: make more DRY with core
	triggerExternalDrop: (event, dropLocation, el, ev, ui) ->
		# trigger 'drop' regardless of whether element represents an event
		@trigger('drop', el[0], dropLocation.start, ev, ui, dropLocation.resourceId)
		if event
			@trigger('eventReceive', null, event) # signal an external event landed


	### Hacks
	# ------------------------------------------------------------------------------------------------------------------
	These triggers usually call mutateEvent with dropLocation, which causes an event modification and rerender.
	But mutateEvent isn't aware of eventResourceField, so it might be setting the wrong property. Workaround.
	TODO: normalize somewhere else. maybe make a hook in core.
	###


	reportEventDrop: (event, dropLocation, otherArgs...) ->
		dropLocation = @normalizeDropLocation(dropLocation)

		# HACK
		# if dropped on a single resourceId, and the event previously had multiple resources,
		# null resourceIds out, which will null it out on the event object.
		# in future, it'd be better to remove the event object's property altogether
		if dropLocation.resourceId and event.resourceIds
			dropLocation.resourceIds = null

		# super-method
		View::reportEventDrop.call(this, event, dropLocation, otherArgs...)


	reportExternalDrop: (meta, dropLocation, otherArgs...) ->
		dropLocation = @normalizeDropLocation(dropLocation)

		# super-method
		View::reportExternalDrop.call(this, meta, dropLocation, otherArgs...)


	normalizeDropLocation: (dropLocation) ->
		out = $.extend({}, dropLocation)
		delete out.resourceId
		@calendar.setEventResourceId(out, dropLocation.resourceId)
		out
