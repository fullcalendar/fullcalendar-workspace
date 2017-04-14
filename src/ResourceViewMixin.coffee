
Calendar.defaults.filterResourcesWithEvents = false

###
A view that structurally distinguishes events by resource
###
ResourceViewMixin = # expects a View

	isResourcesRendered: false
	resourceTextFunc: null

	canRenderSpecificResources: false


	# Scrolling
	# ------------------------------------------------------------------------------------------------------------------


	queryScroll: ->
		$.extend(
			View::queryScroll.apply(this, arguments) # super
			@queryResourceScroll()
		)


	applyScroll: (scroll) ->
		View::applyScroll.apply(this, arguments)
		@applyResourceScroll(scroll)


	queryResourceScroll: ->
		{} # subclasses must implement


	applyResourceScroll: ->
		# subclasses must implement



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


	# Resource Handling (actually render)
	# ------------------------------------------------------------------------------------------------------------------


	handleResources: (resources) ->
		@renderQueue.add =>
			@executeResourcesRender(resources)


	handleResourcesUnset: ->
		@renderQueue.add =>
			@executeResourcesUnrender()


	handleResourceAdd: (resource, allResources) ->
		if @canRenderSpecificResources
			@renderQueue.add =>
				@executeResourceRender(resource)
		else
			@handleResources(allResources)


	handleResourceRemove: (resource, allResources) ->
		if @canRenderSpecificResources
			@renderQueue.add =>
				@executeResourceUnrender(resource)
		else
			@handleResources(allResources)


	# Resource High-level Rendering/Unrendering
	# ------------------------------------------------------------------------------------------------------------------


	executeResourcesRender: (resources) ->
		scroll = @queryScroll()
		@freezeHeight()

		@executeResourcesUnrender(true)
		@renderResources(resources)

		@thawHeight()
		@applyScroll(scroll)

		@isResourcesRendered = true
		@trigger('resourcesRendered')


	executeResourcesUnrender: (willRender) ->
		if @isResourcesRendered
			@trigger('before:resourcesUnrendered')

			if not willRender
				scroll = @queryScroll()
				@freezeHeight()

			@unrenderResources()

			if not willRender
				@thawHeight()
				@applyScroll(scroll)

			@isResourcesRendered = false


	executeResourceRender: (resource) ->
		scroll = @queryScroll()
		@freezeHeight()

		@renderResource(resource)

		@thawHeight()
		@applyScroll(scroll)


	executeResourceUnrender: (resource) ->
		scroll = @queryScroll()
		@freezeHeight()

		@unrenderResource(resource)

		@thawHeight()
		@applyScroll(scroll)


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
