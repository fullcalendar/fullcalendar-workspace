
VertResourceViewMixin = $.extend {}, ResourceViewMixin,


	# Resources
	# ----------------------------------------------------------------------------------------------


	executeResourcesRender: (resources) ->
		@setResourcesOnGrids(resources) # doesn't unrender

		if @isDateRendered
			@requestDateRender().then =>
				@reportResourcesRender()
		else
			# resources will eventually be rendered by date rendering
			Promise.resolve()


	executeResourcesUnrender: (teardownOptions={}) ->
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


	executeDateRender: (date) ->
		View::executeDateRender.apply(this, arguments).then =>
			if @isResourcesSet
				@reportResourcesRender() # resources were rendered


	executeDateUnrender: (date) ->
		View::executeDateUnrender.apply(this, arguments).then =>
			if @isResourcesSet
				@reportResourcesUnrender() # resources were rendered


	# Grid Hookups
	# ----------------------------------------------------------------------------------------------


	setResourcesOnGrids: (resources) -> # for rendering


	unsetResourcesOnGrids: -> # for rendering
