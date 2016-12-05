
Calendar.defaults.filterResourcesWithEvents = false

###
A view that structurally distinguishes events by resource
###
ResourceViewMixin = # expects a View

	isResourcesRendered: false
	isResourcesDirty: false # rendered but outdated?

	resourceRenderQueue: null
	resourceTextFunc: null

	canRenderSpecificResources: false


	setElement: ->
		# put this first, because setElement might need it.
		# don't clear this out in removeElement. headless rendering might continue.
		@resourceRenderQueue = new TaskQueue()

		View::setElement.apply(this, arguments)


	# Date Rendering
	# ------------------------------------------------------------------------------------------------------------------


	onDateRender: ->
		@rejectOn('dateUnrender', @whenResourcesRendered()).then =>
			View::onDateRender.apply(this, arguments)
			# ^ will trigger the public handlers AND render the license warning
			# TODO: only care about public handlers. detangle the two.


	# Events
	# ------------------------------------------------------------------------------------------------------------------


	handleEvents: (events) ->
		if @opt('filterResourcesWithEvents')
			if @isResourcesSet
				resources = @getCurrentResources()
				filteredResources = @filterResourcesWithEvents(resources, events)
				@requestResourcesRender(filteredResources) # will render events
			# else
			#	handleResources will render events later
		else
			if @isResourcesRendered and not @isResourcesDirty
				@requestEventsRender(events)
			# else
			#	handleResources will render events later


	# Resource Handling
	# ------------------------------------------------------------------------------------------------------------------


	handleResources: (resources) ->
		if @opt('filterResourcesWithEvents')
			if @isEventsSet
				events = @getCurrentEvents()
				filteredResources = @filterResourcesWithEvents(resources, events)
				@requestResourcesRender(filteredResources)
			# else
			#	handleEvents will render resources later
		else
			@requestResourcesRender(resources)


	handleUnsetResources: (teardownOptions={}) ->
		if teardownOptions.skipUnrender
			@isResourcesDirty = @isResourcesRendered
		else
			@requestResourcesUnrender(teardownOptions)


	handleAddResource: (resource) ->
		if @canRenderSpecificResources
			if @opt('filterResourcesWithEvents')
				if @isEventsSet
					events = @getCurrentEvents()
					a = @filterResourcesWithEvents([ resource ], events)
					if a.length
						@requestResourceRender(a[0])
				# else
				#	handleEvents will render the resource later
			else
				@requestResourceRender(resource)
		else
			@handleResources(@getCurrentResources())


	handleRemoveResource: (resource) ->
		if @canRenderSpecificResources
			@requestResourceUnrender(resource)
		else
			@handleResources(@getCurrentResources())


	# Resource Rendering/Unrendering Queuing
	# ------------------------------------------------------------------------------------------------------------------


	requestResourcesRender: (resources) ->
		@resourceRenderQueue.add =>
			@executeResourcesRender(resources)


	requestResourcesUnrender: (teardownOptions) ->
		if @isResourcesRendered
			@resourceRenderQueue.add =>
				@executeResourcesUnrender(teardownOptions)
		else
			Promise.resolve()


	requestResourceRender: (resource) -> # canRenderSpecificResources must be activated
		@resourceRenderQueue.add =>
			@executeResourceRender(resource)


	requestResourceUnrender: (resource) -> # canRenderSpecificResources must be activated
		@resourceRenderQueue.add =>
			@executeResourceUnrender(resource)


	# Resource High-level Rendering/Unrendering
	# ------------------------------------------------------------------------------------------------------------------


	executeResourcesRender: (resources) ->
		@captureScroll()
		@freezeHeight()
		@executeResourcesUnrender().then =>
			@renderResources(resources)
			@thawHeight()
			@releaseScroll()
			@reportResourcesRender()


	executeResourcesUnrender: (teardownOptions) ->
		if @isResourcesRendered
			@requestEventsUnrender().then =>
				@captureScroll()
				@freezeHeight()
				@unrenderResources(teardownOptions)
				@thawHeight()
				@releaseScroll()
				@reportResourcesUnrender()
		else
			Promise.resolve()


	executeResourceRender: (resource) ->
		if @isResourcesRendered
			@captureScroll()
			@freezeHeight()
			@renderResource(resource)
			@thawHeight()
			@releaseScroll()
		else
			Promise.reject()


	executeResourceUnrender: (resource) ->
		if @isResourcesRendered
			@captureScroll()
			@freezeHeight()
			@unrenderResource(resource)
			@thawHeight()
			@releaseScroll()
		else
			Promise.reject()


	# Resource Render Triggering
	# ------------------------------------------------------------------------------------------------------------------


	reportResourcesRender: ->
		@isResourcesRendered = true
		@trigger('resourcesRender')

		if @isEventsSet
			@requestEventsRender(@getCurrentEvents())
		return # don't return promise result


	reportResourcesUnrender: ->
		@isResourcesRendered = false
		@isResourcesDirty = false


	# will ignore the current resource render if it is dirty
	whenResourcesRendered: ->
		if @isResourcesRendered and not @isResourcesDirty
			Promise.resolve()
		else
			new Promise (resolve) =>
				@one('resourcesRender', resolve)


	# Resource Low-level Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderResources: (resources) ->
		# abstract


	unrenderResources: (teardownOptions) ->
		# abstract


	renderResource: (resource) ->
		# abstract


	unrenderResource: (resource) ->
		# abstract


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

		@publiclyTrigger(
			'dayClick'
			dayEl # this
			@calendar.applyTimezone(span.start)
			ev
			this # maintain order. this will also be automatically inserted last. oh well
			resourceManager.getResourceById(span.resourceId)
		)


	triggerSelect: (span, ev) ->
		resourceManager = @calendar.resourceManager

		@publiclyTrigger(
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
		@publiclyTrigger('drop', el[0], dropLocation.start, ev, ui, dropLocation.resourceId)
		if event
			@publiclyTrigger('eventReceive', null, event) # signal an external event landed


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


	# Resource Filtering
	# ------------------------------------------------------------------------------------------------------------------


	filterResourcesWithEvents: (resources, events) ->
		resourceIdHits = {}
		for event in events
			for resourceId in @calendar.getEventResourceIds(event)
				resourceIdHits[resourceId] = true

		_filterResourcesWithEvents(resources, resourceIdHits)


# provides a new structure with masked objects
_filterResourcesWithEvents = (sourceResources, resourceIdHits) ->
	filteredResources = []
	for sourceResource in sourceResources
		if sourceResource.children.length
			filteredChildren = _filterResourcesWithEvents(sourceResource.children, resourceIdHits)
			if filteredChildren.length or resourceIdHits[sourceResource.id]
				filteredResource = createObject(sourceResource) # mask
				filteredResource.children = filteredChildren
				filteredResources.push(filteredResource)
		else
			if resourceIdHits[sourceResource.id]
				filteredResources.push(sourceResource)
	filteredResources
