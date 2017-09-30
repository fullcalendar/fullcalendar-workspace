
ResourceViewMixin =

	resourceTextFunc: null
	isResourcesRendered: false


	initResourceView: ->
		# new task
		@watch 'displayingResources', [ 'displayingDates', 'hasResources' ], =>
			@requestResourcesRender(@get('currentResources'))
		, =>
			@requestResourcesUnrender()

		# start relying on displayingResources
		@watch 'displayingBusinessHours', [ 'displayingResources', 'businessHourGenerator' ], (deps) =>
			@requestBusinessHoursRender(deps.businessHourGenerator)
		, =>
			@requestBusinessHoursUnrender()

		# start relying on resource displaying rather than just current resources
		@watch 'displayingEvents', [ 'displayingResources', 'hasEvents' ], =>
			@requestEventsRender(@get('currentEvents'))
		, =>
			@requestEventsUnrender()


	# Logic: base render trigger should fire when BOTH the resources and dates have rendered,
	# but the unrender trigger should fire after ONLY the dates are about to be unrendered.
	bindBaseRenderHandlers: ->
		isBaseRendered = false

		@on 'resourcesRendered', =>
			if not isBaseRendered and @isDatesRendered
				isBaseRendered = true
				@whenSizeUpdated(@triggerViewRender.bind(this))

		@on 'datesRendered', =>
			if not isBaseRendered and @isResourcesRendered
				isBaseRendered = true
				@whenSizeUpdated(@triggerViewRender.bind(this))

		@on 'before:datesUnrendered', ->
			if isBaseRendered
				isBaseRendered = false
				@triggerViewDestroy()


	# Scroll
	# ----------------------------------------------------------------------------------------------


	queryScroll: ->
		scroll = View::queryScroll.apply(this, arguments)

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


	# Rendering Utils
	# ----------------------------------------------------------------------------------------------


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


	# Resource Change Handling
	# ----------------------------------------------------------------------------------------------


	handleResourceAdd: (resource) ->
		@requestResourceRender(resource)


	handleResourceRemove: (resource) ->
		@requestResourceUnrender(resource)


	# Resource Rendering
	# ----------------------------------------------------------------------------------------------


	requestResourcesRender: (resources) ->
		@requestRender =>
			@executeResourcesRender(resources)
		, 'resource', 'init'


	requestResourcesUnrender: ->
		@requestRender =>
			@executeResourcesUnrender()
		, 'resource', 'destroy'


	requestResourceRender: (resource) ->
		@requestRender =>
			@executeResourceRender(resource)
		, 'resource', 'add'


	requestResourceUnrender: (resource) ->
		@requestRender =>
			@executeResourceUnrender(resource)
		, 'resource', 'remove'


	# Resource High-level Rendering/Unrendering
	# ----------------------------------------------------------------------------------------------


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


	# Triggering
	# ----------------------------------------------------------------------------------------------


	###
	footprint is a ResourceComponentFootprint
	###
	triggerDayClick: (footprint, dayEl, ev) ->
		dateProfile = @calendar.footprintToDateProfile(footprint)

		@publiclyTrigger('dayClick', {
			context: dayEl
			args: [
				dateProfile.start
				ev
				this
				if footprint.resourceId
					@calendar.resourceManager.getResourceById(footprint.resourceId)
				else
					null
			]
		})


	###
	footprint is a ResourceComponentFootprint
	###
	triggerSelect: (footprint, ev) ->
		dateProfile = @calendar.footprintToDateProfile(footprint)

		@publiclyTrigger('select', {
			context: this
			args: [
				dateProfile.start
				dateProfile.end
				ev
				this
				if footprint.resourceId
					@calendar.resourceManager.getResourceById(footprint.resourceId)
				else
					null
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
