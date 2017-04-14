
###
For vertical resource view.
For views that rely on grids that render their resources and dates in the same pass.
###
VertResourceViewMixin = $.extend {}, ResourceViewMixin,


	# Resource Binding
	# ----------------------------------------------------------------------------------------------


	handleDateProfile: (dateProfile, forcedScroll) ->
		if not @has('currentResources') and not @isDestroying
			View::handleDateProfile.apply(this, arguments)


	handleDateProfileUnset: ->
		if not @has('currentResources')
			View::handleDateProfileUnset.apply(this, arguments)


	# Resource Handling
	# ----------------------------------------------------------------------------------------------


	handleResources: (resources) ->
		if @has('dateProfile') and not @isDestroying
			@renderQueue.add =>
				@executeDatesAndResourcesRender(@get('dateProfile'), resources)


	handleResourcesUnset: ->
		if @has('dateProfile')
			@renderQueue.add =>
				@executeDatesAndResourcesUnrender()


	# Resource+Date Rendering
	# ----------------------------------------------------------------------------------------------


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
