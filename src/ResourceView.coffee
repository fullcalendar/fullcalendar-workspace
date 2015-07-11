
class ResourceView extends View

	displayingResources: null
	assigningResources: null


	displayView: ->
		$.when(super).then =>
			@displayResources()


	displayEvents: (events) ->
		$.when(@displayResources()).then => # will have gotten resource data too, for event rendering
			super(events)


	unrenderSkeleton: ->
		@clearResources()


	#
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
		# TODO: unlink from displaying

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


	assignResources: (resources) -> # TODO: remove resources param?
		@assigningResources or=
			$.when(resources or @calendar.resourceManager.getResources())
				.then (resources) =>
					@setResources(resources)


	unassignResources: -> # TODO: kill this now?
		assigning = @assigningResources
		if assigning
			assigning.then =>
				@unsetResources()
				@assigningResources = null
		else
			$.when()


	#
	# ------------------------------------------------------------------------------------------------------------------


	setResources: (resources) ->


	unsetResources: ->


	renderStoredResources: -> #TODO::::: renderResources()


	unrenderStoredResources: ->



	# Triggers
	# ------------------------------------------------------------------------------------------------------------------

	triggerDayClick: (cell, dayEl, ev) ->
		resourceManager = @calendar.resourceManager

		@trigger(
			'dayClick'
			dayEl # this
			cell.start
			ev
			this # maintain order. this will also be automatically inserted last. oh well
			resourceManager.getResourceById(cell.resourceId)
		)


	triggerSelect: (range, ev) ->
		resourceManager = @calendar.resourceManager

		@trigger(
			'select'
			null
			range.start
			range.end
			ev
			this # maintain order. this will also be automatically inserted last. oh well
			resourceManager.getResourceById(range.resourceId)
		)

