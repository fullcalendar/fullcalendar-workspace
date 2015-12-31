
class ResourceBasicView extends FC.BasicView

	@mixin ResourceView

	dayGridClass: ResourceDayGrid


	renderHead: ->
		super
		@dayGrid.processHeadResourceEls(@headContainerEl)


	setResources: (resources) ->
		@dayGrid.setResources(resources)


	unsetResources: ->
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