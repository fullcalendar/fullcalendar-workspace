
###
For vertical resource view.
For views that rely on grids that render their resources and dates in the same pass.
###
VertResourceViewMixin = $.extend {}, ResourceViewMixin,

	isDestroying: false # hack to prevent rerendering while destroying


	setElement: ->
		ResourceViewMixin.setElement.apply(this, arguments)
		@watchDatesAndResources()


	removeElement: ->
		@isDestroying = true
		ResourceViewMixin.removeElement.apply(this, arguments)
		@unwatchDatesAndResources()
		@isDestroying = false


	# Resource Binding
	# ----------------------------------------------------------------------------------------------


	watchDatesAndResources: ->
		isRendered = false

		@watch 'displayingDates', [ 'dateProfile', '?currentResources' ], (deps) =>
			# DON'T render if we know there are resources available.
			# This lets displayingResources handle it.
			# This may introduce imbalance between rendering/unrendering,
			# so introduce isRendered as a safeguard.
			if not @isDestroying and not deps.currentResources
				isRendered = true
				@requestDateRender(deps.dateProfile)
		, =>
			if isRendered
				@requestDateUnrender()

		@watch 'displayingResources', [ 'dateProfile', 'currentResources' ], (deps) =>
			if not @isDestroying
				isRendered = true
				@requestDatesAndResourcesRender(deps.dateProfile, deps.currentResources)
		, =>
			if isRendered
				@requestDatesAndResourcesUnrender()


	unwatchDatesAndResources: ->
		@unwatch('displayingResources') # do first, because might clear BOTH resources and dates
		@unwatch('displayingDates')


	# Resource Handling
	# ----------------------------------------------------------------------------------------------


	handleResources: (resources) ->
		# don't request rendering nor set displayingResources. watchDatesAndResources does it.


	handleResourcesUnset: ->
		# don't request rendering nor set displayingResources. watchDatesAndResources does it.


	# Resource+Date Rendering
	# ----------------------------------------------------------------------------------------------


	requestDatesAndResourcesRender: (dateProfile, resources) ->
		@renderQueue.add =>
			@executeDatesAndResourcesRender(dateProfile, resources)


	requestDatesAndResourcesUnrender: ->
		@renderQueue.add =>
			@executeDatesAndResourcesUnrender()


	executeDatesAndResourcesRender: (dateProfile, resources) ->
		@setResourcesOnGrids(resources) # doesn't unrender
		@executeDateRender(dateProfile)
		@trigger('resourcesRendered')


	executeDatesAndResourcesUnrender: ->
		@trigger('before:resourcesUnrendered')
		@unsetResourcesOnGrids() # doesn't unrender
		@executeDateUnrender()


	# Grid Hookups
	# ----------------------------------------------------------------------------------------------


	setResourcesOnGrids: (resources) -> # for rendering
		# abstract


	unsetResourcesOnGrids: -> # for rendering
		# abstract
