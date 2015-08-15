
# TODO: be 100% sure of return values here. want to allow .fullCalendar() jQuery chaining

class CalendarExtension extends Calendar

	resourceManager: null


	initialize: -> # don't need to call super or anything
		@resourceManager = new ResourceManager(this)


	instantiateView: (viewType) ->
		spec = @getViewSpec(viewType)
		viewClass = spec['class']

		if @options.resources and spec.options.resources != false and spec.resourceClass
			viewClass = spec.resourceClass

		new viewClass(this, viewType, spec.options, spec.duration)


	# for the API only
	# retrieves what is currently in memory. no fetching
	getResources: ->
		@resourceManager.topLevelResources


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


	rerenderResources: -> # for API
		@view.redisplayResources?()


	getEventResourceId: (event) -> # KILL THIS?
		@resourceManager.getEventResourceId(event)
		# TODO: getEventResource?


	getPeerEvents: (event, range) ->
		peerEvents = super

		rangeResourceId = range.resourceId or '' #always normalize like this?
		filteredPeerEvents = []

		for peerEvent in peerEvents
			peerResourceId = @getEventResourceId(peerEvent) or ''
			if not peerResourceId or peerResourceId == rangeResourceId
				filteredPeerEvents.push(peerEvent)

		filteredPeerEvents


	buildSelectRange: (start, end, resourceId) ->
		range = super
		if resourceId
			range.resourceId = resourceId
		range


	getResourceById: (id) ->
		@resourceManager.getResourceById(id)


	# NOTE: views pair *segments* to resources. that's why there's no code reuse
	getEventsForResource: (idOrResource) ->
		resource = @getResourceById(
			if typeof idOrResource == 'object'
				idOrResource.id
			else
				idOrResource
		)
		if resource
			eventResourceField = @resourceManager.getEventResourceField()
			@clientEvents (event) -> # return value
				event[eventResourceField] == resource.id
		else
			[]


	getResourceForEvent: (idOrEvent) ->
		event = @clientEvents(
			if typeof idOrEvent == 'object'
				idOrEvent.id
			else
				idOrEvent
		)[0]
		if event
			resourceId = @resourceManager.getEventResourceId(event)
			return @getResourceById(resourceId)
		return null



	# TODO: select method


Calendar.prototype = CalendarExtension.prototype
