
###
For vertical resource view.
For views that rely on grids that render their resources and dates in the same pass.
###
VertResourceViewMixin = $.extend {}, ResourceViewMixin,


	setElement: ->
		ResourceViewMixin.setElement.apply(this, arguments)

		isDisplayingDatesOnly = false
		isDisplayingBoth = false

		needsScroll = false
		@watch 'dateProfileOnly', [ 'dateProfile' ], =>
			needsScroll = true

		# temporary rendering of just date
		@watch 'displayingDatesOnly', [ 'dateProfile', '?currentResources' ], (deps) =>
			if not deps.currentResources and not @isDestroying
				isDisplayingDatesOnly = true
				@renderQueue.queue =>
					@executeDateRender(deps.dateProfile, not needsScroll)
					needsScroll = false
				, 'date', 'init'
		, =>
			if isDisplayingDatesOnly
				isDisplayingDatesOnly = false
				@renderQueue.queue =>
					@executeDateUnrender()
				, 'date', 'destroy'

		# override
		@watch 'displayingDates', [ 'dateProfile', 'currentResources' ], (deps) =>
			if not @isDestroying
				isDisplayingBoth = true
				@renderQueue.queue =>
					@setResourcesOnGrids(deps.currentResources) # doesn't unrender
					@executeDateRender(deps.dateProfile, not needsScroll)
					needsScroll = false
					@trigger('resourcesRendered')
				, 'resource', 'init'
		, =>
			if isDisplayingBoth
				isDisplayingBoth = false
				@renderQueue.queue =>
					@trigger('before:resourcesUnrendered')
					@unsetResourcesOnGrids() # doesn't unrender
					@executeDateUnrender()
				, 'resource', 'destroy'

		@watch 'displayingResources', [ 'displayingDates' ], =>
			true
		, =>
			false


	# Grid Hookups
	# ----------------------------------------------------------------------------------------------


	setResourcesOnGrids: (resources) -> # for rendering
		# abstract


	unsetResourcesOnGrids: -> # for rendering
		# abstract
