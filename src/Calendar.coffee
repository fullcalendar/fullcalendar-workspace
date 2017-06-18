
# NOTE: for public methods, always be sure of the return value. for chaining

class CalendarExtension extends Calendar

	resourceManager: null


	initialize: -> # don't need to call super or anything
		@resourceManager = new ResourceManager(this)


	instantiateView: (viewType) ->
		spec = @getViewSpec(viewType)
		viewClass = spec['class']

		if @opt('resources') and spec.options.resources != false
			if spec.queryResourceClass
				viewClass = spec.queryResourceClass(spec) or viewClass # might return falsy
			else if spec.resourceClass
				viewClass = spec.resourceClass

		new viewClass(this, spec)


	# for the API only
	# retrieves what is currently in memory. no fetching
	getResources: ->
		Array.prototype.slice.call( # make a copy
			@resourceManager.topLevelResources
		)


	addResource: (resourceInput, scroll=false) -> # assumes all resources already loaded
		promise = @resourceManager.addResource(resourceInput)

		if scroll and @view.scrollToResource
			promise.then (resource) =>
				@view.scrollToResource(resource)

		return


	removeResource: (idOrResource) -> # assumes all resources already loaded
		@resourceManager.removeResource(idOrResource)


	refetchResources: -> # for API
		@resourceManager.clear()
		@view.flash('initialResources')
		return


	rerenderResources: -> # for API
		@resourceManager.resetCurrentResources()
		return


	# enforce resource ID constraint
	isFootprintAllowed: (footprint, peerEventFootprints, constraintVal, overlapVal, subjectEventInstance) ->
		if typeof constraintVal == 'object'

			constrainToResourceIds = Resource.extractIds(constraintVal, this)

			if constrainToResourceIds.length and (
				not (footprint instanceof ResourceComponentFootprint) or
				not (footprint.resourceId in constrainToResourceIds)
			)
				return false

		super


	getPeerEventInstances: (subjectEventDef) ->
		subjectResourceIds = subjectEventDef.getResourceIds()
		peerInstances = super

		if not subjectResourceIds.length
			peerInstances
		else
			peerInstances.filter (peerInstance) ->
				for resourceId in subjectResourceIds
					if not peerInstance.def.resourceIds.length or \ # non-resource event OR
							peerInstance.def.hasResourceId(resourceId) # within same resource?
						return true # ...then consider it a peer
				false


	buildCurrentBusinessFootprints: (wholeDay) ->
		flatResources = @resourceManager.getFlatResources()
		anyCustomBusinessHours = false

		# any per-resource business hours? or will one global businessHours suffice?
		for resource in flatResources
			if resource.businessHours
				anyCustomBusinessHours = true

		# if there are any custom business hours, all business hours must be sliced per-resources
		if anyCustomBusinessHours
			footprints = []

			for resource in flatResources
				plainFootprints = @_buildCurrentBusinessFootprints(
					wholeDay
					resource.businessHours or @opt('businessHours')
				)

				for plainFootprint in plainFootprints
					footprints.push(
						new ResourceComponentFootprint(
							plainFootprint.unzonedRange,
							plainFootprint.isAllDay,
							resource.id
						)
					)

			footprints
		else
			super(wholeDay)


	buildSelectFootprint: (zonedStartInput, zonedEndInput, resourceId) ->
		plainFootprint = super

		if resourceId
			new ResourceComponentFootprint(
				plainFootprint.unzonedRange,
				plainFootprint.isAllDay,
				resourceId
			)
		else
			plainFootprint


	getResourceById: (id) ->
		@resourceManager.getResourceById(id)


	# Resources + Events
	# ----------------------------------------------------------------------------------------


	# DEPRECATED. for external API backwards compatibility
	getEventResourceId: (event) ->
		@getEventResourceIds(event)[0]


	getEventResourceIds: (event) ->
		eventDef = @eventManager.getEventDefByUid(event._id)

		if eventDef
			eventDef.getResourceIds()
		else
			[]


	# DEPRECATED
	setEventResourceId: (event, resourceId) ->
		@setEventResourceIds(
			event
			if resourceId then [ resourceId ] else []
		)


	setEventResourceIds: (event, resourceIds) ->
		eventDef = @eventManager.getEventDefByUid(event._id)

		if eventDef
			eventDef.resourceIds =
				for rawResourceId in resourceIds
					Resource.normalizeId(rawResourceId)


	# NOTE: views pair *segments* to resources. that's why there's no code reuse
	getResourceEvents: (idOrResource) ->
		resource =
			if typeof idOrResource == 'object'
				idOrResource
			else
				@getResourceById(idOrResource)

		if resource
			# return the event cache, filtered by events assigned to the resource
			# TODO: move away from using clientId
			@clientEvents (event) =>
				$.inArray(resource.id, @getEventResourceIds(event)) != -1
		else
			[]


	# DEPRECATED. for external API backwards compatibility
	getEventResource: (idOrEvent) ->
		@getEventResources(idOrEvent)[0]


	getEventResources: (idOrEvent) ->
		event =
			if typeof idOrEvent == 'object'
				idOrEvent
			else
				@clientEvents(idOrEvent)[0]

		resources = []
		if event
			for resourceId in @getEventResourceIds(event)
				resource = @getResourceById(resourceId)
				if resource
					resources.push(resource)
		resources


Calendar.prototype = CalendarExtension.prototype # nothing subclasses Calendar, so this is okay
