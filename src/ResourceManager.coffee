
# TODO: search for use of resource.id (should be resource._id)
#  (or should we just do resource.id normalized?)


class ResourceManager extends Class

	@mixin Emitter

	@resourceGuid: 1
	@ajaxDefaults:
		dataType: 'json'
		cache: false

	calendar: null
	topLevelResources: null # if null, indicates not fetched
	resourcesById: null
	getting: null # a deferred
	fetching: null # a promise


	constructor: (@calendar) ->
		@unsetResources()


	# Resource Data Getting
	# ------------------------------------------------------------------------------------------------------------------


	getResources: -> # returns a promise
		getting = @getting
		if not getting
			getting = @getting = $.Deferred()
			@fetchResources()
				.done (resources) ->
					getting.resolve(resources)
				.fail ->
					getting.resolve([])
		getting.promise()


	fetchResources: -> # returns a promise
		prevFetching = @fetching
		$.when(prevFetching).then =>
			@fetching = @fetchResourceInputs().then (resourceInputs) =>
				@setResources(resourceInputs)
				if prevFetching
					@trigger('reset', @topLevelResources) # TODO:::::: fire this after assignResources returns?
				@topLevelResources

			###
			@fetching = @fetchResourceInputs()
				.then (resourceInputs) =>
					@setResources(resourceInputs)
					@topLevelResources
				.done =>
					if prevFetching
						@trigger('reset', @topLevelResources) # TODO:::::: fire this after the promise returns?
			###



	fetchResourceInputs: -> # returns a promise
		deferred = $.Deferred()
		source = @calendar.options['resources']

		if $.type(source) == 'string'
			source = { url: source }

		switch $.type(source)

			when 'function'
				source (resourceInputs) =>
					deferred.resolve(resourceInputs)
				# TODO: timeout!?

			when 'object'
				promise = $.ajax($.extend({}, ResourceManager.ajaxDefaults, source))

			when 'array'
				deferred.resolve(source)

			else
				deferred.resolve([])

		promise or= deferred.promise()

		if not promise.state() == 'pending'
			@calendar.pushLoading()
			promise.always ->
				@calendar.popLoading()

		promise


	getResourceById: (id) -> # assumes already returned from fetch
		@resourcesById[id]


	# Resource Adding
	# ------------------------------------------------------------------------------------------------------------------


	unsetResources: ->
		@topLevelResources = []
		@resourcesById = {}


	setResources: (resourceInputs) ->
		@unsetResources()

		resources = for resourceInput in resourceInputs
			@buildResource(resourceInput)

		validResources = (resource for resource in resources \
			when @addResourceToIndex(resource))

		for resource in validResources
			@addResourceToTree(resource)
		return


	addResource: (resourceInput) -> # returns a promise
		$.when(@fetching).then =>
			resource = @buildResource(resourceInput)
			if @addResourceToIndex(resource)
				@addResourceToTree(resource)
				@trigger('add', resource)
				resource
			else
				false


	addResourceToIndex: (resource) ->
		if @resourcesById[resource._id]
			false
		else
			@resourcesById[resource._id] = resource
			for child in resource.children
				@addResourceToIndex(child)
			true


	addResourceToTree: (resource) ->
		if not resource._parent

			if resource._parentId
				parent = @resourcesById[resource._parentId]
				if parent
					resource._parent = parent
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
				idOrResource._id
			else
				idOrResource

		$.when(@fetching).then =>
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
				@removeResourceFromIndex(child._id)
			resource
		else
			false


	removeResourceFromTree: (resource, siblings=@topLevelResources) ->
		for sibling, i in siblings
			if sibling == resource
				resource._parent = null
				siblings.splice(i, 1)
				return true
			if @removeResourceFromTree(resource, sibling.children)
				return true
		false


	# Resource Data Utils
	# ------------------------------------------------------------------------------------------------------------------


	buildResource: (resourceInput) ->
		# QUESTION: do we use .id or ._id in the code???

		resource = $.extend({}, resourceInput)
		resource._id = String((resourceInput.id ? '_fc' + (ResourceManager.resourceGuid++)) or '')
		resource._parentId = String(resourceInput[@getResourceParentField()] or '')

		# TODO: consolidate repeat logic
		rawClassName = resourceInput.className
		resource.className =
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
				child._parent = resource
				child

		resource


	getResourceParentField: ->
		@calendar.options['resourceParentProperty'] or 'parentId' # TODO: put into defaults


	# Event Utils
	# ------------------------------------------------------------------------------------------------------------------


	getEventResourceId: (event) ->
		String(event[@getEventResourceField()] or '')


	setEventResourceId: (event, resourceId) ->
		event[@getEventResourceField()] = String(resourceId or '')


	getEventResourceField: ->
		@calendar.options['eventResourceProperty'] or 'resourceId' # TODO: put into defaults

