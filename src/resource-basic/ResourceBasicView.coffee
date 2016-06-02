
class ResourceBasicView extends FC.BasicView

	@mixin ResourceViewMixin

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@dayGrid.setResources(resources)

		# TODO: optimize. only redisplay the columns
		@clearView()
		@displayView()


	unsetResources: (isDestroying) ->
		@clearEvents()

		@dayGrid.unsetResources()

		# HACK
		# don't re-render resources if we don't need to
		# solves ResourceManager unbinding bugs
		if not isDestroying
			# TODO: optimize. only redisplay the columns
			@clearView()
			@displayView()
