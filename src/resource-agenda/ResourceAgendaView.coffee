
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
		if @isSkeletonRendered
			@renderDates()
			@updateSize()


	unrenderStoredResources: ->
		if @isSkeletonRendered
			@renderDates()
			@updateSize()