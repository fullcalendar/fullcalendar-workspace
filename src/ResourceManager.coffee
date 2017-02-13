
class ResourceManager extends Class

	@mixin EmitterMixin

	@resourceGuid: 1
	@ajaxDefaults:
		dataType: 'json'
		cache: false

	calendar: null
	fetchId: 0
	topLevelResources: null # if null, indicates not fetched
	resourcesById: null
	fetching: null # a promise. the last fetch. never cleared afterwards


	constructor: (@calendar) ->
		@initializeCache()


	# Resource Data Getting
	# ------------------------------------------------------------------------------------------------------------------


	###
	Like fetchResources, but won't refetch if already fetched (regardless of start/end).
	###
	getResources: (start, end, timezone) -> # returns a promise
		@fetching or @fetchResources(start, end, timezone)


	###
	Will always fetch, even if done previously.
	Accepts optional chrono-related params to pass on to the raw resource sources.
	Returns a promise.
	###
	fetchResources: (start, end, timezone) ->
		currentFetchId = (@fetchId += 1)
		@fetching = new Promise (resolve, reject) =>
			@fetchResourceInputs (resourceInputs) =>
				if currentFetchId == @fetchId
					@setResources(resourceInputs)
					resolve(@topLevelResources)
				else
					reject()
			, start, end, timezone


	###
	Accepts optional chrono-related params to pass on to the raw resource sources.
	Calls callback when done.
	###
	fetchResourceInputs: (callback, start, end, timezone) ->
		calendar = @calendar
		source = calendar.options['resources']

		if $.type(source) == 'string'
			source = { url: source }

		switch $.type(source)

			when 'function'
				@calendar.pushLoading()
				source (resourceInputs) =>
					@calendar.popLoading()
					callback(resourceInputs)
				, start, end, timezone

			when 'object'
				calendar.pushLoading()

				requestParams = {}
				if start
					requestParams[calendar.options.startParam] = start.format()
				if end
					requestParams[calendar.options.endParam] = end.format()
				if timezone and timezone != 'local'
					requestParams[calendar.options.timezoneParam] = timezone # TODO: make this more global

				$.ajax(
					$.extend(
						{ data: requestParams }
						ResourceManager.ajaxDefaults
						source
					)
				).then (resourceInputs) =>
					calendar.popLoading()
					callback(resourceInputs)
				# TODO: handle failure

			when 'array'
				callback(source)

			else
				callback([])


	getResourceById: (id) -> # assumes already returned from fetch
		@resourcesById[id]



	# assumes already completed fetch
	getFlatResources: ->
		for id of @resourcesById
			@resourcesById[id]


	# Resource Adding
	# ------------------------------------------------------------------------------------------------------------------


	initializeCache: ->
		@topLevelResources = []
		@resourcesById = {}


	setResources: (resourceInputs) ->
		wasSet = Boolean(@topLevelResources)
		@initializeCache()

		resources = for resourceInput in resourceInputs
			@buildResource(resourceInput)

		validResources = (resource for resource in resources \
			when @addResourceToIndex(resource))

		for resource in validResources
			@addResourceToTree(resource)

		if wasSet
			@trigger('reset', @topLevelResources)
		else
			@trigger('set', @topLevelResources)

		@calendar.publiclyTrigger('resourcesSet', null, @topLevelResources)


	resetCurrentResources: -> # resend what we already have
		if @topLevelResources
			@trigger('reset', @topLevelResources)


	addResource: (resourceInput) -> # returns a promise
		@getResources().then => # wait for initial batch of resources
			resource = @buildResource(resourceInput)
			if @addResourceToIndex(resource)
				@addResourceToTree(resource)
				@trigger('add', resource)
				resource
			else
				false


	addResourceToIndex: (resource) ->
		if @resourcesById[resource.id]
			false
		else
			@resourcesById[resource.id] = resource
			for child in resource.children
				@addResourceToIndex(child)
			true


	addResourceToTree: (resource) ->
		if not resource.parent
			parentId = String(resource['parentId'] ? '')

			if parentId
				parent = @resourcesById[parentId]
				if parent
					resource.parent = parent
					siblings = parent.children
				else
					return false
			else
				siblings = @topLevelResources

			siblings.push(resource)
		true


	# Resource Removing
	# ------------------------------------------------------------------------------------------------------------------


	removeResource: (idOrResource) ->
		id =
			if typeof idOrResource == 'object'
				idOrResource.id
			else
				idOrResource

		@getResources().then => # wait for initial batch of resources
			resource = @removeResourceFromIndex(id)
			if resource
				@removeResourceFromTree(resource)
				@trigger('remove', resource)
			resource


	removeResourceFromIndex: (resourceId) ->
		resource = @resourcesById[resourceId]
		if resource
			delete @resourcesById[resourceId]
			for child in resource.children
				@removeResourceFromIndex(child.id)
			resource
		else
			false


	removeResourceFromTree: (resource, siblings=@topLevelResources) ->
		for sibling, i in siblings
			if sibling == resource
				resource.parent = null
				siblings.splice(i, 1)
				return true
			if @removeResourceFromTree(resource, sibling.children)
				return true
		false


	# Resource Data Utils
	# ------------------------------------------------------------------------------------------------------------------


	buildResource: (resourceInput) ->

		resource = $.extend({}, resourceInput)
		resource.id = String(resourceInput.id ? '_fc' + ResourceManager.resourceGuid++)

		# TODO: consolidate repeat logic
		rawClassName = resourceInput.eventClassName
		resource.eventClassName =
			switch $.type(rawClassName)
				when 'string'
					rawClassName.split(/\s+/)
				when 'array'
					rawClassName
				else
					[]

		resource.children =
			for childInput in resourceInput.children ? []
				child = @buildResource(childInput)
				child.parent = resource
				child

		resource

