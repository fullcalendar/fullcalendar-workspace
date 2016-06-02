
# NOTE: for public methods, always be sure of the return value. for chaining

class CalendarExtension extends Calendar

	resourceManager: null


	initialize: -> # don't need to call super or anything
		@resourceManager = new ResourceManager(this)


	instantiateView: (viewType) ->
		spec = @getViewSpec(viewType)
		viewClass = spec['class']

		if @options.resources and spec.options.resources != false
			if spec.queryResourceClass
				viewClass = spec.queryResourceClass(spec) or viewClass # might return falsy
			else if spec.resourceClass
				viewClass = spec.resourceClass

		new viewClass(this, viewType, spec.options, spec.duration)


	# for the API only
	# retrieves what is currently in memory. no fetching
	getResources: ->
		Array.prototype.slice.call( # make a copy
			@resourceManager.topLevelResources
		)


	addResource: (resourceInput, scroll=false) -> # assumes all resources already loaded
		promise = @resourceManager.addResource(resourceInput)

		if scroll and @view.scrollToResource
			promise.done (resource) =>
				@view.scrollToResource(resource)

		return


	removeResource: (idOrResource) -> # assumes all resources already loaded
		@resourceManager.removeResource(idOrResource)


	refetchResources: -> # for API
		@resourceManager.fetchResources()
		return


	rerenderResources: -> # for API
		# will cause listeners of resources data to re-receive and re-render
		@resourceManager.resetResources()
		return


	# Returns a list of events that the given event should be compared against when being considered for a move to
	# the specified span. Attached to the Calendar's prototype because EventManager is a mixin for a Calendar.
	#
	# this method will take effect for *all* views, event ones that don't explicitly
	# support resources. shouln't assume a resourceId on the span or event.
	# `event` can be null.
	getPeerEvents: (span, event) ->
		peerEvents = super

		# if the span (basically the target drop area) has a resource, use its ID.
		# otherwise, assume the the event wants to keep it's existing resource IDs.
		newResourceIds =
			if span.resourceId
				[ span.resourceId ]
			else if event
				@getEventResourceIds(event)
			else
				[]

		# find peer events that have one of the new resourceIds
		filteredPeerEvents = []
		for peerEvent in peerEvents
			isPeer = false
			peerResourceIds = @getEventResourceIds(peerEvent)

			if not peerResourceIds.length or not newResourceIds.length
				# when of the events isn't associated with ANY resources, it is considered
				# to span across ALL resource, and should always be a peer (potential for colliding)
				isPeer = true
			else
				for peerResourceId in peerResourceIds
					for newResourceId in newResourceIds
						if newResourceId == peerResourceId
							isPeer = true
							break
			if isPeer
				filteredPeerEvents.push(peerEvent)

		filteredPeerEvents


	buildSelectSpan: (startInput, endInput, resourceId) ->
		span = super
		if resourceId
			span.resourceId = resourceId
		span


	getResourceById: (id) ->
		@resourceManager.getResourceById(id)


	# Resources + Events
	# ----------------------------------------------------------------------------------------


	# make sure events have defined values for the resource-related properties.
	# essential for DnD's revertFunc to work, which relies on revert to old not-undefined properties.
	# essential for the case where `resourceId` overrode `resourceIds` and needs to be reverted.
	normalizeEvent: (event) ->
		super
		event.resourceId ?= null
		event.resourceIds ?= null


	# DEPRECATED. for external API backwards compatibility
	getEventResourceId: (event) ->
		@getEventResourceIds(event)[0]


	getEventResourceIds: (event) ->
		resourceId = String(
			event[@getEventResourceField()] ?
			event.resourceId ? # sometimes `event` is actually a span :(
			''
		)

		# we make event.resourceId take precedence over event.resourceIds
		# because in DnD code, the helper event is programatically assigned a event.resourceId
		# which is more convenient when it overrides event.resourceIds
		if resourceId
			[ resourceId ]

		else if event.resourceIds
			normalResourceIds = []
			for resourceId in event.resourceIds
				normalResourceId = String(resourceId ? '')
				if normalResourceId
					normalResourceIds.push(normalResourceId)
			normalResourceIds

		else
			[]


	setEventResourceId: (event, resourceId) ->
		event[@getEventResourceField()] = String(resourceId ? '')


	getEventResourceField: -> # DEPRECATED: eventResourceField
		@options['eventResourceField'] or 'resourceId'


	# NOTE: views pair *segments* to resources. that's why there's no code reuse
	getResourceEvents: (idOrResource) ->
		resource =
			if typeof idOrResource == 'object'
				idOrResource
			else
				@getResourceById(idOrResource)

		if resource
			# return the event cache, filtered by events assigned to the resource
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
