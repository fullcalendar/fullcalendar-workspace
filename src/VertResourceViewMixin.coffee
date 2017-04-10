
###
For vertical resource view.
For views that rely on grids that render their resources and dates in the same pass.
###
VertResourceViewMixin = $.extend {}, ResourceViewMixin,


	setElement: ->
		ResourceViewMixin.setElement.apply(this, arguments)
		@watchDatesAndResources()


	removeElement: ->
		ResourceViewMixin.removeElement.apply(this, arguments)
		@unwatchDatesAndResources()


	watchDatesAndResources: ->
		# override displayingDates to also watch currentResources
		@watch 'displayingDates', [ 'dateProfile', '?currentResources' ], (deps) =>
			if deps.currentResources
				@requestDatesAndResourcesRender(deps.dateProfile, deps.currentResources)
			else
				@requestDateRender(deps.dateProfile)
		, =>
			if @has('currentResources')
				@requestDatesAndResourcesUnrender()
			else
				@requestDateUnrender()


	unwatchDatesAndResources: ->
		@unwatch('displayingDates')


	requestResourcesRender: (resources) ->
		# don't add anything to the render queue
		# resource rendering is handled by watchDatesAndResources


	requestResourcesUnrender: ->
		# don't add anything to the render queue
		# resource rendering is handled by watchDatesAndResources


	requestDatesAndResourcesRender: (dateProfile, resources) ->
		@set('displayingResources', true)
		@renderQueue.add =>
			@executeDatesAndResourcesRender(dateProfile, resources)


	requestDatesAndResourcesUnrender: ->
		@unset('displayingResources')
		@renderQueue.add =>
			@executeDatesAndResourcesUnrender()


	executeDatesAndResourcesRender: (dateProfile, resources) ->
		@setResourcesOnGrids(resources) # doesn't unrender
		@executeDateRender(dateProfile)


	executeDatesAndResourcesUnrender: ->
		@unsetResourcesOnGrids() # doesn't unrender
		@executeDateUnrender()


	# Grid Hookups
	# ----------------------------------------------------------------------------------------------


	setResourcesOnGrids: (resources) -> # for rendering
		# abstract


	unsetResourcesOnGrids: -> # for rendering
		# abstract
