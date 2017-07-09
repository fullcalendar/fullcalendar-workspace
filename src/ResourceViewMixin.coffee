
Calendar.defaults.filterResourcesWithEvents = false

###
A view that structurally distinguishes events by resource
###
ResourceViewMixin = # expects a View

	isResourcesRendered: false
	resourceTextFunc: null


	setElement: ->
		View::setElement.apply(this, arguments)

		# new task
		@watch 'displayingResources', [ 'hasResources' ], =>
			@requestResourcesRender(@get('currentResources'))
		, =>
			@requestResourcesUnrender()

		# start relying on resource displaying rather than just current resources
		@watch 'displayingEvents', [ 'displayingDates', 'hasEvents', 'displayingResources' ], =>
			@requestEventsRender(@get('currentEvents'))
		, =>
			@requestEventsUnrender()


	# Scrolling
	# ------------------------------------------------------------------------------------------------------------------


	queryScroll: ->
		scroll = View::queryScroll.apply(this, arguments) # super

		if @isResourcesRendered
			$.extend(scroll, @queryResourceScroll())

		scroll


	applyScroll: (scroll) ->
		View::applyScroll.apply(this, arguments)

		if @isResourcesRendered
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


	# Resource Change Handling
	# ------------------------------------------------------------------------------------------------------------------


	handleResourcesSet: (resources) ->
		# displayingResources does initial rendering


	handleResourcesUnset: ->
		# displayingResources does teardown unrendering


	handleResourceAdd: (resource) ->
		@requestResourceRender(resource)


	handleResourceRemove: (resource) ->
		@requestResourceUnrender(resource)


	# Resource Rendering
	# ------------------------------------------------------------------------------------------------------------------


	requestResourcesRender: (resources) ->
		@renderQueue.queue =>
			@executeResourcesRender(resources)
		, 'resource', 'init'


	requestResourcesUnrender: ->
		@renderQueue.queue =>
			@executeResourcesUnrender()
		, 'resource', 'destroy'


	requestResourceRender: (resource) ->
		@renderQueue.queue =>
			@executeResourceRender(resource)
		, 'resource', 'add'


	requestResourceUnrender: (resource) ->
		@renderQueue.queue =>
			@executeResourceUnrender(resource)
		, 'resource', 'remove'


	# Resource High-level Rendering/Unrendering
	# ------------------------------------------------------------------------------------------------------------------


	executeResourcesRender: (resources) ->
		@renderResources(resources)
		@isResourcesRendered = true
		@trigger('resourcesRendered')


	executeResourcesUnrender: ->
		@trigger('before:resourcesUnrendered')
		@unrenderResources()
		@isResourcesRendered = false


	executeResourceRender: (resource) ->
		@renderResource(resource)


	executeResourceUnrender: (resource) ->
		@unrenderResource(resource)


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
	isEventDefDraggable: (eventDef) ->
		@isEventDefResourceEditable(eventDef) or View::isEventDefDraggable.call(this, eventDef)


	isEventDefResourceEditable: (eventDef) ->
		eventDef.resourceEditable ?
			(eventDef.source || {}).resourceEditable ? # TODO: make part of model
			@opt('eventResourceEditable') ?
			@isEventDefGenerallyEditable(eventDef)


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


	###
	footprint is a ResourceComponentFootprint
	###
	triggerDayClick: (footprint, dayEl, ev) ->
		dateProfile = @calendar.footprintToDateProfile(footprint) # abuse of "Event"DateProfile?

		@publiclyTrigger('dayClick', {
			context: dayEl
			args: [
				dateProfile.start
				ev
				this
				@calendar.resourceManager.getResourceById(footprint.resourceId)
			]
		})


	###
	footprint is a ResourceComponentFootprint
	###
	triggerSelect: (footprint, ev) ->
		dateProfile = @calendar.footprintToDateProfile(footprint) # abuse of "Event"DateProfile?

		@publiclyTrigger('select', {
			context: this
			args: [
				dateProfile.start
				dateProfile.end
				ev
				this
				@calendar.resourceManager.getResourceById(footprint.resourceId)
			]
		})


	# override the view's default trigger in order to provide a resourceId to the `drop` event
	# TODO: make more DRY with core
	triggerExternalDrop: (singleEventDef, isEvent, el, ev, ui) ->

		# trigger 'drop' regardless of whether element represents an event
		@publiclyTrigger('drop', {
			context: el[0]
			args: [
				singleEventDef.dateProfile.start.clone()
				ev
				ui
				singleEventDef.getResourceIds()[0]
				this
			]
		})

		if isEvent
			# signal an external event landed
			@publiclyTrigger('eventReceive', {
				context: this
				args: [
					singleEventDef.buildInstance().toLegacy()
					this
				]
			})
