
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
