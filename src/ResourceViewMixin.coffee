
###
A view that structurally distinguishes events by resource
###
ResourceViewMixin = # expects a View

	isResourcesSet: false
	resourceRenderQueue: null
	resourceTextFunc: null


	# assumes dates have been rendered
	setResources: (resources) ->
		if @isResourcesSet
			@resetResources(resources)
		else
			@isResourcesSet = true
			@getResourceRenderQueue().push =>
				@captureScroll()
				@freezeHeight()

				@renderResources(resources)

				@thawHeight()
				@releaseScroll()


	unsetResources: (isDestroying) ->
		if @isResourcesSet
			@isResourcesSet = false
			@getResourceRenderQueue().clear()
			@stopDisplayingEvents() # events are assumed to be on top of resources
			@unrenderResources(isDestroying)


	resetResources: (resources) ->
		isEventsSet = @isEventsSet

		@captureScroll()
		@freezeHeight()

		@unsetResources()
		@setResources(resources).then =>
			@thawHeight()
			@releaseScroll()

			if isEventsSet # was previously displaying events?
				@displayEvents() # caller will wait for this promise


	addResource: (resource) ->
		@getResourceRenderQueue().push =>
			@renderResource(resource) # allowed to return a promise


	removeResource: (resource) ->
		@getResourceRenderQueue().push =>
			@unrenderResource(resource) # allowed to return a promise


	renderResources: (resources) ->
		@displayResources() # will redisplay


	unrenderResources: (isDestroying) ->
		@displayResources() # will redisplay


	# by default, rerender all resources. don't bother with an individual resource.
	renderResource: (resource) ->
		@displayResources() # will redisplay


	# by default, rerender all resources. don't bother with an individual resource.
	unrenderResource: (resource) ->
		@displayResources() # will redisplay


	getResourceRenderQueue: ->
		@resourceRenderQueue ?= new RunQueue()


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
