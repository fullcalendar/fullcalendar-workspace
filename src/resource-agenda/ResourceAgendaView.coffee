
class ResourceAgendaView extends FC.AgendaView

	@mixin ResourceView

	timeGridClass: ResourceTimeGrid
	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@timeGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@timeGrid.setResources(resources)
		if @dayGrid
			@dayGrid.setResources(resources)


	unsetResources: ->
		@timeGrid.unsetResources()
		if @dayGrid
			@dayGrid.unsetResources()


	renderStoredResources: ->
		@redisplay()


	unrenderStoredResources: ->
		@redisplay()


	# Responsible for rendering the new resource
	addResource: (resource) ->
		@resetResources() # will call unsetResources / setResources
		@redisplay()


	# Responsible for unrendering the old resource
	removeResource: (resource) ->
		@resetResources() # will call unsetResources / setResources
		@redisplay()
