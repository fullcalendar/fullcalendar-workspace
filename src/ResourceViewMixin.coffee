
###
A view that structurally distinguishes events by resource
###
ResourceViewMixin = # expects a View

	isResourcesSet: false
	isResourcesRendered: false
	resourceRenderQueue: null
	resourceTextFunc: null


	setElement: ->
		# put this first, because setElement might need it.
		# don't clear this out in removeElement. headless rendering might continue.
		@resourceRenderQueue = new RunQueue()

		View::setElement.apply(this, arguments)


	# Hooks into standard rendering
	# ------------------------------------------------------------------------------------------------------------------


	triggerDateRender: ->
		@ensureRenderResources().then =>
			View::triggerDateRender.call(this, arguments)


	resolveEventRenderDeps: ->
		@ensureRenderResources()


	# Resource Data
	# ------------------------------------------------------------------------------------------------------------------


	setResources: (resources) ->
		if @isResourcesSet
			@resetResources(resources)
		else
			@isResourcesSet = true
			@requestRenderResources(resources)


	# if `resources` not specified, will use current
	resetResources: (resources) ->
		wasEventsSet = @isEventsSet

		Promise.resolve(resources or @requestResources()).then (resources) =>
			@captureScroll()
			@freezeHeight()

			@unsetResources(true) # true = the view doesn't need to be pretty after
			@setResources(resources).then =>
				@thawHeight()
				@releaseScroll()

				if wasEventsSet
					@resetEvents()
				return # don't wait for anything


	unsetResources: (isDestroying) ->
		if @isResourcesSet
			@isResourcesSet = false
			@requestUnrenderResources(isDestroying)


	addResource: (resource) ->
		@resetResources() # rerender all by default. subclasses can opt to use requestRenderResource


	removeResource: (resource) ->
		@resetResources() # rerender all by default. subclasses can opt to use requestUnrenderResource


	# Resource Rendering Queue
	# ------------------------------------------------------------------------------------------------------------------


	requestRenderResources: (resources) ->
		@resourceRenderQueue.add =>
			@captureScroll()
			@freezeHeight()

			@renderResources(resources)

			@thawHeight()
			@releaseScroll()

			@isResourcesRendered = true


	requestUnrenderResources: (isDestroying) ->
		@resourceRenderQueue.add =>
			@requestUnrenderEvents().then =>
				@captureScroll()
				@freezeHeight()

				@unrenderResources(isDestroying)

				@thawHeight()
				@releaseScroll()

				@isResourcesRendered = false


	requestRenderResource: (resource) -> # not called by default
		@resourceRenderQueue.add =>
			@renderResource(resource)


	requestUnrenderResource: (resource) -> # not called by default
		@resourceRenderQueue.add =>
			@unrenderResource(resource)


	ensureRenderResources: ->
		if @isResourcesRendered
			Promise.resolve()
		else
			new Promise (resolve) =>
				@resourceRenderQueue.one('ran', resolve) # fire when next task done


	# Actual Resource Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderResources: (resources) ->
		# abstract


	unrenderResources: (isDestroying) ->
		# abstract


	renderResource: (resource) ->
		# abstract, for requestRenderResource


	unrenderResource: (resource) ->
		# abstract, for requestUnrenderResource


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
