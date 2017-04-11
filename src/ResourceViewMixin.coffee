
Calendar.defaults.filterResourcesWithEvents = false

###
A view that structurally distinguishes events by resource
###
ResourceViewMixin = # expects a View

	resourceTextFunc: null

	canRenderSpecificResources: false


	setElement: ->
		View::setElement.apply(this, arguments)

		# replace the `currentResources` dependency with `displayingResources`,
		# which means resources need to be rendered before events can be rendered.
		@watch 'displayingEvents', [ 'displayingDates', 'currentEvents', 'displayingResources' ], (deps) =>
			@requestEventsRender(deps.currentEvents)
			return # no return promise
		, =>
			@requestEventsUnrender()
			return # no return promise


	# this exists solely for sub-mixins of ResourceViewMixin
	removeElement: ->
		View::removeElement.apply(this, arguments)


	# When the "meat" of the view is rendered (aka the base)
	# -----------------------------------------------------------------------------------------------------------------


	# NOTE: we don't need to worry about because unbindBaseRenderHandlers removes all .baseHandler
	# Logic: base render trigger should fire when BOTH the resources and dates have rendered,
	# but the unrender trigger should fire after ONLY the dates are about to be unrendered.
	bindBaseRenderHandlers: ->
		isResourcesRendered = false
		isDatesRendered = false

		@on 'resourcesRendered.baseHandler', ->
			if not isResourcesRendered
				isResourcesRendered = true
				if isDatesRendered
					@onBaseRender()

		@on 'datesRendered.baseHandler', ->
			if not isDatesRendered
				isDatesRendered = true
				if isResourcesRendered
					@onBaseRender()

		@on 'before:resourcesUnrendered.baseHandler', ->
			if isResourcesRendered
				isResourcesRendered = false

		@on 'before:datesUnrendered.baseHandler', ->
			if isDatesRendered
				isDatesRendered = false
				@onBeforeBaseUnrender()


	onBaseRender: ->
		View::onBaseRender.apply(this, arguments)
		processLicenseKey(
			@calendar.options.schedulerLicenseKey
			@el # container element
		)


	# Resource Handling (actually render)
	# ------------------------------------------------------------------------------------------------------------------


	handleResources: (resources) ->
		@requestResourcesRender(resources)
		@set('displayingResources', true) # this needs to go after the request


	handleResourcesUnset: ->
		@unset('displayingResources')
		@requestResourcesUnrender()


	handleResourceAdd: (resource, allResources) ->
		if @canRenderSpecificResources
			@requestResourceRender(resource)
		else
			@handleResources(allResources)


	handleResourceRemove: (resource, allResources) ->
		if @canRenderSpecificResources
			@requestResourceUnrender(resource)
		else
			@handleResources(allResources)


	# Resource Rendering/Unrendering Queuing
	# ------------------------------------------------------------------------------------------------------------------


	requestResourcesRender: (resources) ->
		@renderQueue.add =>
			@executeResourcesRender(resources)


	requestResourcesUnrender: ->
		@renderQueue.add =>
			@executeResourcesUnrender()


	requestResourceRender: (resource) -> # canRenderSpecificResources must be activated
		@renderQueue.add =>
			@executeResourceRender(resource)


	requestResourceUnrender: (resource) -> # canRenderSpecificResources must be activated
		@renderQueue.add =>
			@executeResourceUnrender(resource)


	# Resource High-level Rendering/Unrendering
	# ------------------------------------------------------------------------------------------------------------------


	executeResourcesRender: (resources) ->
		@captureScroll()
		@freezeHeight()
		@renderResources(resources)
		@thawHeight()
		@releaseScroll()
		@trigger('resourcesRendered')


	executeResourcesUnrender: ->
		@trigger('before:resourcesUnrendered')
		@captureScroll()
		@freezeHeight()
		@unrenderResources()
		@thawHeight()
		@releaseScroll()


	executeResourceRender: (resource) ->
		@captureScroll()
		@freezeHeight()
		@renderResource(resource)
		@thawHeight()
		@releaseScroll()


	executeResourceUnrender: (resource) ->
		@captureScroll()
		@freezeHeight()
		@unrenderResource(resource)
		@thawHeight()
		@releaseScroll()


	# Resource Low-level Rendering
	# ------------------------------------------------------------------------------------------------------------------


	renderResources: (resources) ->
		# abstract


	unrenderResources: ->
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


	reportExternalDrop: (meta, dropLocation, otherArgs...) ->
		dropLocation = @normalizeDropLocation(dropLocation)

		# super-method
		View::reportExternalDrop.call(this, meta, dropLocation, otherArgs...)


	normalizeDropLocation: (dropLocation) ->
		out = $.extend({}, dropLocation)
		delete out.resourceId
		@calendar.setEventResourceId(out, dropLocation.resourceId)
		out
