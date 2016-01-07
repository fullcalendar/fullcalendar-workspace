
class ResourceView extends View

	displayingResources: null
	assigningResources: null
	resourceTextFunc: null


	displayView: ->
		$.when(super).then =>
			@displayResources()


	displayEvents: (events) ->
		$.when(@displayResources()).then => # will have gotten resource data too, for event rendering
			super(events)


	unrenderSkeleton: ->
		@clearResources()


	# Resource Getting / Displaying
	# ------------------------------------------------------------------------------------------------------------------


	displayResources: ->
		@listenToResources()
		$.when(@displayingResources).then =>
			@displayingResources or=
				@assignResources().then =>
					@renderStoredResources()


	clearResources: ->
		displaying = @displayingResources
		if displaying
			displaying.then => # consider this async!??
				@clearEvents()
				@unrenderStoredResources()
				@displayingResources = null
		else
			$.when()


	redisplayResources: ->
		scrollState = @queryScroll()
		@clearResources()
			.then => @displayResources()
			.then =>
				@setScroll(scrollState)
				@calendar.rerenderEvents()


	resetResources: (resources) -> # can be triggered by the resourcemanager, even when this view isn't rendered
		# TODO: unlink from display-related code

		if not @displayingResources
			@unassignResources()
				.then => @assignResources(resources)
		else
			scrollState = @queryScroll()
			@clearResources()
				.then => @unassignResources()
				.then => @assignResources(resources)
				.then => @displayResources()
				.then =>
					@setScroll(scrollState)
					@calendar.rerenderEvents()

	###
	resources param is optional. if not given, gets them from resourceManager
	###
	assignResources: (resources) ->
		@assigningResources or=
			$.when(resources or @calendar.resourceManager.getResources())
				.then (resources) =>
					@setResources(resources)


	unassignResources: ->
		assigning = @assigningResources
		if assigning
			assigning.then =>
				@unsetResources()
				@assigningResources = null
		else
			$.when()


	# Resource Displaying (subclasses must implement)
	# ------------------------------------------------------------------------------------------------------------------


	setResources: (resources) ->


	unsetResources: ->


	renderStoredResources: ->


	unrenderStoredResources: ->


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

		super(event, dropLocation, otherArgs...)


	reportExternalDrop: (meta, dropLocation, otherArgs...) ->
		dropLocation = @normalizeDropLocation(dropLocation)
		super(meta, dropLocation, otherArgs...)


	normalizeDropLocation: (dropLocation) ->
		out = $.extend({}, dropLocation)
		delete out.resourceId
		@calendar.resourceManager.setEventResourceId(out, dropLocation.resourceId)
		out
