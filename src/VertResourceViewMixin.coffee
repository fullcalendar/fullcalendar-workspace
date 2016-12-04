
VertResourceViewMixin = $.extend {}, ResourceViewMixin,


	# Resources
	# ----------------------------------------------------------------------------------------------


	forceResourcesRender: (resources) ->
		@setResourcesOnGrids(resources) # doesn't unrender

		if @isDateRendered
			@requestDateRender().then =>
				@reportResourcesRender()
		else
			# resources will eventually be rendered by date rendering
			Promise.resolve()


	forceResourcesUnrender: (teardownOptions={}) ->
		@unsetResourcesOnGrids() # doesn't unrender

		if @isDateRendered and not teardownOptions.skipRerender
			@requestDateRender().then =>
				@reportResourcesUnrender()
		else
			# no need to unrender resources
			@reportResourcesUnrender()
			Promise.resolve()


	# Dates
	# ----------------------------------------------------------------------------------------------


	forceDateRender: (date) ->
		View::forceDateRender.apply(this, arguments).then =>
			if @isResourcesSet
				@reportResourcesRender() # resources were rendered


	forceDateUnrender: (date) ->
		View::forceDateUnrender.apply(this, arguments).then =>
			if @isResourcesSet
				@reportResourcesUnrender() # resources were rendered


	# Grid Hookups
	# ----------------------------------------------------------------------------------------------


	setResourcesOnGrids: (resources) -> # for rendering


	unsetResourcesOnGrids: -> # for rendering
